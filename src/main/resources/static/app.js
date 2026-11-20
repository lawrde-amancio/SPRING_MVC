const API_URL = "http://localhost:8080/api/students";
const API_AUTH = "http://localhost:8080/api/auth";

// Initialize page-specific listeners and data on load
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("studentTableBody")) {
        getAllStudents();
    }

    const studentForm = document.getElementById("studentForm");
    if (studentForm) {
        studentForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (typeof validateStudentForm === "function" && !validateStudentForm()) {
                return;
            }

            const id = document.getElementById("studentId").value;
            const studentData = {
                firstName: document.getElementById("firstName").value.trim(),
                lastName: document.getElementById("lastName").value.trim(),
                email: document.getElementById("email").value.trim()
            };

            if (id) {
                updateStudent(id, studentData);
            } else {
                createStudent(studentData);
            }
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const loginDto = {
                username: document.getElementById("username").value.trim(),
                password: document.getElementById("password").value
            };
            loginUser(loginDto);
        });
    }
});

// Helper function to reset form state
function resetForm() {
    const studentId = document.getElementById("studentId");
    const studentForm = document.getElementById("studentForm");
    const submitBtn = document.getElementById("submitBtn");

    if (studentId) studentId.value = "";
    if (studentForm) studentForm.reset();
    if (submitBtn) {
        submitBtn.textContent = "Add Student";
        submitBtn.style.backgroundColor = "#28a745";
    }

    if (typeof clearValidationStyles === "function") {
        clearValidationStyles();
    }
}

// Create a student
async function createStudent(studentData) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            alert("Student added successfully!");
            resetForm();
            getAllStudents();
        } else {
            alert("Error adding student.");
        }
    } catch (error) {
        console.error("Error creating student:", error);
    }
}

// Get all students
async function getAllStudents() {
    try {
        const response = await fetch(API_URL, {
            credentials: "include"
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error("Network response was not ok");

        const students = await response.json();
        const tableBody = document.getElementById("studentTableBody");
        tableBody.innerHTML = "";

        students.forEach(student => {
            const row = `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.firstName}</td>
                    <td>${student.lastName}</td>
                    <td>${student.email}</td>
                    <td>
                        <button class="btn-edit" onclick="initializeStudentFormById(${student.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        alert("Failed to fetch students. Is your Spring Boot backend running?");
    }
}

// Load student into form for editing
async function initializeStudentFormById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            credentials: "include"
        });
        if (!response.ok) throw new Error("Could not fetch student details.");

        const student = await response.json();

        document.getElementById("studentId").value = student.id;
        document.getElementById("firstName").value = student.firstName;
        document.getElementById("lastName").value = student.lastName;
        document.getElementById("email").value = student.email;

        const submitBtn = document.getElementById("submitBtn");
        submitBtn.textContent = "Update";
        submitBtn.style.backgroundColor = "#007bff";

        if (typeof clearValidationStyles === "function") {
            clearValidationStyles();
        }
    } catch (error) {
        console.error("Error fetching student details:", error);
    }
}

// Update student
async function updateStudent(id, studentData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            alert("Student updated successfully!");
            resetForm();
            getAllStudents();
        } else {
            alert("Error updating student.");
        }
    } catch (error) {
        console.error("Error updating student:", error);
    }
}

// Delete student
async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (response.ok) {
                const message = await response.text();
                alert(message);
                getAllStudents();
            } else {
                alert("Error deleting student.");
            }
        } catch (error) {
            console.error("Error deleting student:", error);
        }
    }
}

// Login user
async function loginUser(loginDto) {
    try {
        const response = await fetch(`${API_AUTH}/auth_login_session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(loginDto)
        });

        if (response.ok) {
            alert("Login successful!");
            window.location.href = "index.html";
        } else {
            alert("Invalid credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
    }
}

// Logout user
async function logoutUser() {
    try {
        await fetch(`${API_AUTH}/logout`, {
            method: "POST",
            credentials: "include"
        });
        document.getElementById("studentTableBody").innerHTML = "";
        resetForm();
        alert("Logged out successfully!");

        try {
            await fetch(API_URL, {
                method: "PUT",
                headers: {
                    "Authorization": "Basic " + btoa("invalid_user:wrong_password")
                }
            });
        } catch (err) {
            console.log("Browser credentials cache cleared.");
        }
        window.location.reload();
    } catch (e) {
        console.error("Logout transmission crash:", e);
    }
}