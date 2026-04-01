import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [allAttendance, setAllAttendance] = useState([]);
  const [newStudent, setNewStudent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const getToday = () => new Date().toLocaleDateString("en-CA");
  const [selectedMonth, setSelectedMonth] = useState(getToday().slice(0, 7));

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-");
    return new Date(year, month, 0).getDate();
  };

  // Fetch data
  const fetchStudents = async () => {
    const snapshot = await getDocs(collection(db, "students"));
    setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAttendance = async () => {
    const snapshot = await getDocs(collection(db, "attendance"));
    setAllAttendance(
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    );
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchStudents();
      fetchAttendance();
    }
  }, [isUnlocked]);

  // Add students
  const addStudent = async () => {
    const names = newStudent
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    for (let name of names) {
      await addDoc(collection(db, "students"), { name });
    }

    setNewStudent("");
    fetchStudents();
  };

  // Toggle attendance
  const toggleAttendance = (id) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Save attendance
  const saveAttendance = async () => {
    const today = getToday();

    for (let student of students) {
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", student.id),
        where("date", "==", today),
      );

      const existing = await getDocs(q);

      if (!existing.empty) {
        await updateDoc(doc(db, "attendance", existing.docs[0].id), {
          present: attendance[student.id] || false,
        });
      } else {
        await addDoc(collection(db, "attendance"), {
          studentId: student.id,
          date: today,
          present: attendance[student.id] || false,
        });
      }
    }

    alert("Attendance saved!");
    setAttendance({});
    fetchAttendance();
  };

  // Stats
  const getStats = (studentId) => {
    const records = allAttendance.filter(
      (a) => a.studentId === studentId && a.date.startsWith(selectedMonth),
    );

    const presentDays = records
      .filter((r) => r.present)
      .map((r) => parseInt(r.date.split("-")[2]));

    const absentDays = records
      .filter((r) => !r.present)
      .map((r) => parseInt(r.date.split("-")[2]));

    return { presentDays, absentDays };
  };

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 420,
        margin: "auto",
        fontFamily: "system-ui",
      }}
    >
      {!isUnlocked ? (
        // 🔒 LOCK SCREEN
        <div
          style={{
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h2>ISBA Attendance</h2>

          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              marginTop: 10,
            }}
          />

          <button
            onClick={() => {
              if (pin === "1603") setIsUnlocked(true);
              else alert("Wrong PIN");
            }}
            style={{
              marginTop: 10,
              padding: 12,
              background: "#111",
              color: "white",
              borderRadius: 10,
              border: "none",
            }}
          >
            Unlock
          </button>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 18, color: "#64748b" }}>ISBA</div>
            <div style={{ fontSize: 32, fontWeight: "700" }}>Attendance</div>
          </div>

          {/* ADD STUDENTS */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <h3>Add Students</h3>

            <textarea
              value={newStudent}
              onChange={(e) => setNewStudent(e.target.value)}
              placeholder="Enter names (one per line)"
              style={{
                width: "100%",
                height: 100,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            />

            <button
              onClick={addStudent}
              style={{
                marginTop: 10,
                width: "100%",
                padding: 12,
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 10,
              }}
            >
              Add Students
            </button>
          </div>

          {/* ATTENDANCE */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <h3>Mark Today ({getToday()})</h3>

            {students.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                }}
              >
                <span>{s.name}</span>
                <input
                  type="checkbox"
                  checked={attendance[s.id] || false}
                  onChange={() => toggleAttendance(s.id)}
                />
              </div>
            ))}

            <button
              onClick={saveAttendance}
              style={{
                marginTop: 10,
                width: "100%",
                padding: 14,
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 10,
              }}
            >
              Save Attendance
            </button>
          </div>

          {/* MONTH SELECT */}
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <h3>Select Month</h3>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          {/* REPORT */}
          <div style={{ background: "#fff", padding: 16, borderRadius: 14 }}>
            <h3>Report ({selectedMonth})</h3>

            {students.map((s) => {
              const stats = getStats(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    background: "#f1f5f9",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  <strong>{s.name}</strong>

                  <div style={{ color: "#16a34a" }}>
                    ✔ {stats.presentDays.length} days
                  </div>

                  <div style={{ color: "#dc2626", fontSize: 14 }}>
                    ❌ {stats.absentDays.length} days
                  </div>
                </div>
              );
            })}
          </div>

          {/* CALENDAR POPUP */}
          {selectedStudent &&
            (() => {
              const stats = getStats(selectedStudent.id);
              const totalDays = getDaysInMonth();

              return (
                <div
                  style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "white",
                    padding: 20,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "60vh",
                    overflowY: "auto",
                  }}
                >
                  <h3 style={{ textAlign: "center" }}>
                    {selectedStudent.name}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: 8,
                      marginTop: 15,
                    }}
                  >
                    {Array.from({ length: totalDays }, (_, i) => {
                      const day = i + 1;
                      const isPresent = stats.presentDays.includes(day);
                      const isAbsent = stats.absentDays.includes(day);

                      return (
                        <div
                          key={day}
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            textAlign: "center",
                            background: isPresent
                              ? "#dcfce7"
                              : isAbsent
                                ? "#fee2e2"
                                : "#e2e8f0",
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSelectedStudent(null)}
                    style={{
                      marginTop: 15,
                      width: "100%",
                      padding: 12,
                      background: "#111",
                      color: "white",
                      borderRadius: 10,
                    }}
                  >
                    Close
                  </button>
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
