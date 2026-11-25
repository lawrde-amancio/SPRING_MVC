const API_URL = "http://localhost:8080/api/students";
const API_AUTH = "http://localhost:8080/api/auth";

/**
 * Initializes event listeners and loads initial data once 
 * the DOM is fully parsed.
 */
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("studentTableBody")) {
        getAllStudents();
    }

    const studentForm = document.getElementById("studentForm");
    if (studentForm) {
        studentForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (typeof validateStudentForm ===
                "function" && !validateStudentForm()) {
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

/**
 * Resets the student form fields, restores the submit button to its default
 * "Add Student" state, and clears any active validation styling.
 *
 * @returns {void}
 */
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

/**
 * Sends a POST request to create a new student record, then resets the form
 * and refreshes the student table on success.
 *
 * @async
 * @param {Object} studentData - The payload containing new student details.
 * @param {string} studentData.firstName - The student's first name.
 * @param {string} studentData.lastName - The student's last name.
 * @param {string} studentData.email - The student's email address.
 * @returns {Promise<void>}
 */
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

/**
 * Fetches all students from the backend and renders them into the HTML table.
 * Redirects to `login.html` if the user is unauthorized (401 or 403).
 *
 * @async
 * @returns {Promise<void>}
 */
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
                        <button class="btn-edit" 
                        onclick="initializeStudentFormById(${student.id})">
                        Edit</button>
                        <button class="btn-delete" 
                        onclick="deleteStudent(${student.id})">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        alert(
            "Failed to fetch students. Is your Spring Boot backend running?");
    }
}

/**
 * Fetches a single student's details by ID and populates the student form
 * for editing, switching the submit button to "Update" mode.
 *
 * @async
 * @param {number|string} id - The unique identifier of the student to edit.
 * @returns {Promise<void>}
 */
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

/**
 * Sends a PUT request to update an existing student record by ID,
 * then resets the form and refreshes the student table on success.
 *
 * @async
 * @param {number|string} id - The unique identifier of the student to update.
 * @param {Object} studentData - The updated student details.
 * @param {string} studentData.firstName - The updated first name.
 * @param {string} studentData.lastName - The updated last name.
 * @param {string} studentData.email - The updated email address.
 * @returns {Promise<void>}
 */
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

/**
 * Prompts the user for confirmation and sends a DELETE request to remove
 * a student record by ID, refreshing the table upon success.
 *
 * @async
 * @param {number|string} id - The unique identifier of the student to delete.
 * @returns {Promise<void>}
 */
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

/**
 * Authenticates a user by posting credentials to the session login endpoint
 * and redirects to `index.html` on success.
 *
 * @async
 * @param {Object} loginDto - The user's login credentials.
 * @param {string} loginDto.username - The user's username.
 * @param {string} loginDto.password - The user's password.
 * @returns {Promise<void>}
 */
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

/**
 * Logs out the currently authenticated user, clears the student
 *  table and form,
 * attempts to invalidate cached browser Basic Auth credentials, 
 * and reloads the page.
 *
 * @async
 * @returns {Promise<void>}
 */
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
                    "Authorization": "Basic " + btoa(
                        "invalid_user:wrong_password")
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