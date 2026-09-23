import {useEffect, useState} from 'react'
import {API_URL} from "./api.js";
import * as path from "node:path";

function App() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);

    const [form, setForm] = useState({
        studentId: "",
        courseId: "",
        grade: ""
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    async function getJson(path) {
        const res = await fetch(`${API_URL}${path}`);
        if (!res.ok) throw new Error(`Failed to fetch from path ${path}`);
        return res.json();
    }


    useEffect(() => {
        async function loadData() {
            try {
                const [enrollmentData, studentData, courseData] = await Promise.all([
                    getJson("/api/enrollments"),
                    getJson("/api/students"),
                    getJson("/api/courses"),
                ])

                setEnrollments(enrollmentData);
                setStudents(studentData);
                setCourses(courseData);


            } catch (err) {
                console.log(err)

                setError("Error loading a portion of data from the API");

            } finally {
                setLoading(false)
            }
        }

        loadData();
    }, [])

  async function handleSubmit(e) {
      e.preventDefault();
      setSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch(`${API_URL}/api/enrollments`, {
          method: "POST",
          headers: {"content-type": "application/json"},
          body: JSON.stringify({
            studentId: Number (form.studentId),
            courseId: Number(form.courseId),
            grade: form.grade,
          })
        })

        if(!res.ok){
          const body = await res.json().catch(()=> ({}))
          setSubmitError(body.error|| "Something went really wrong")
          return;
        }

        const created = await res.json();

        setEnrollments((prev)=> [...prev, created]);
        setForm({
          studentId: "",
          courseId: "",
          grade: ""
        })


      } catch (err){
        console.log(err);
        setSubmitting("Could not reach the server.");
      } finally {
        setLoading(false)
      }

  }

  function handleChange(e) {
      const {name, value} = e.target;
      setForm((prev)=> ({...prev, [name]: value}));
  }


    let content;
    if (loading) content = <p>Is Loading...</p>;
    else if (error) content = <p style={{color: "red"}}>{error}</p>;
    else if (enrollments.length === 0) content = <p>No Enrollments</p>;
    else content = enrollments.map((enrollment, idx) => (
            <div key={idx}>
                <h2>{enrollment.course.code}</h2>
                <h2>{enrollment.student.name}</h2>
            </div>
        ));

    return (
        <>
            <div>{content}</div>
          {!loading && !error &&(
              <form onSubmit={handleSubmit}>

                <label>
                  Student
                  <select name="studentId" value={form.studentId} onChange={handleChange} required>
                    <option value={""}>Choose a student</option>
                    {
                      students.map((student) => (
                          <option value={student.id} key={student.id}>{student.name}</option>
                      ))
                    }
                  </select>
                </label>

                <label>
                  Course
                  <select name="courseId" value={form.courseId} onChange={handleChange} required>
                    <option value={""}>Choose a course</option>
                    {
                      courses.map((course) => (
                          <option value={course.id} key={course.id}>{course.code}: {course.title}</option>
                      ))
                    }
                  </select>
                </label>


                <label>
                  Grade (optional)
                  <select name={"grade"} value={form.grade} onChange={handleChange}>
                    <option value={""}>Not graded yet</option>
                    {
                      ["A+", "B", "C"].map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                      ))
                    }
                  </select>
                </label>

                <button type={"submit"}>Enroll</button>

                {
                  submitError && (
                      <p>{submitError}</p>
                    )
                }
              </form>

          )}
        </>
    )
}

export default App
