import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  // =====================================================
  // PAGE
  // =====================================================

  const [page, setPage] = useState("login");

  // =====================================================
  // USER LOGIN
  // =====================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // =====================================================
  // REGISTER
  // =====================================================

  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newDateOfBirth, setNewDateOfBirth] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCgpa, setNewCgpa] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =====================================================
  // USER DASHBOARD
  // =====================================================

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("loggedInUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // =====================================================
  // ADMIN LOGIN
  // =====================================================

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || ""
  );

  // =====================================================
  // ADMIN USERS
  // =====================================================

  const [users, setUsers] = useState([]);

  // =====================================================
  // EDIT USER
  // =====================================================

  const [editingUser, setEditingUser] = useState(null);

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCgpa, setEditCgpa] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // =====================================================
  // ADD USER
  // =====================================================

  const [showAddUser, setShowAddUser] = useState(false);

  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addDateOfBirth, setAddDateOfBirth] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addCgpa, setAddCgpa] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addIsAdmin, setAddIsAdmin] = useState(false);

  // =====================================================
  // USER LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      alert("Login successful!");

      setLoggedInUser(data.user);

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
      );

      setUsername("");
      setPassword("");

      setPage("dashboard");
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to backend. Make sure Node server is running."
      );
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName.trim(),
            username: newUsername.trim(),
            date_of_birth: newDateOfBirth,
            city: newCity.trim(),
            cgpa: newCgpa,
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Registration successful!");

      setNewName("");
      setNewUsername("");
      setNewDateOfBirth("");
      setNewCity("");
      setNewCgpa("");
      setNewPassword("");
      setConfirmPassword("");

      setPage("login");
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to backend. Make sure Node server is running."
      );
    }
  };

  // =====================================================
  // USER LOGOUT
  // =====================================================

  const handleUserLogout = () => {
    localStorage.removeItem("loggedInUser");

    setLoggedInUser(null);

    setPage("login");
  };

  // =====================================================
  // ADMIN LOGIN
  // =====================================================

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: adminUsername,
            password: adminPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Admin login failed");
        return;
      }

      alert("Admin login successful!");

      setAdminToken(data.token);

      localStorage.setItem(
        "adminToken",
        data.token
      );

      setAdminUsername("");
      setAdminPassword("");

      await getUsers(data.token);

      setPage("adminDashboard");
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to backend. Make sure Node server is running."
      );
    }
  };

  // =====================================================
  // GET USERS
  // =====================================================

  const getUsers = async (token = adminToken) => {
    if (!token) {
      alert("Admin login required");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not load users");
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to backend while loading users."
      );
    }
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const handleEdit = (user) => {
    setEditingUser(user);

    setEditName(user.name || "");
    setEditUsername(user.username || "");

    setEditDateOfBirth(
      user.date_of_birth
        ? String(user.date_of_birth).substring(0, 10)
        : ""
    );

    setEditCity(user.city || "");
    setEditCgpa(user.cgpa != null ? String(user.cgpa) : "");
    setEditPassword("");
    setEditIsAdmin(Boolean(user.is_admin));

    setShowAddUser(false);
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setEditingUser(null);

    setEditName("");
    setEditUsername("");
    setEditDateOfBirth("");
    setEditCity("");
    setEditCgpa("");
    setEditPassword("");
    setEditIsAdmin(false);
  };

  // =====================================================
  // SAVE EDIT
  // =====================================================

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingUser) {
      return;
    }

    if (!editName.trim()) {
      alert("Name is required");
      return;
    }

    if (!editUsername.trim()) {
      alert("Username is required");
      return;
    }

    if (!editDateOfBirth) {
      alert("Date of birth is required");
      return;
    }

    if (!editCity.trim()) {
      alert("City is required");
      return;
    }

    if (editCgpa === "" || Number(editCgpa) < 0 || Number(editCgpa) > 10) {
      alert("CGPA must be between 0 and 10");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: editName.trim(),
            username: editUsername.trim(),
            date_of_birth: editDateOfBirth,
            city: editCity.trim(),
            cgpa: Number(editCgpa),
            password: editPassword,
            is_admin: editIsAdmin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message || "Failed to update user"
        );
        return;
      }

      alert("User updated successfully!");

      handleCancelEdit();

      await getUsers();
    } catch (error) {
      console.error(error);

      alert("Cannot connect to backend.");
    }
  };

  // =====================================================
  // ADD USER
  // =====================================================

  const resetAddUserForm = () => {
    setAddName("");
    setAddUsername("");
    setAddDateOfBirth("");
    setAddCity("");
    setAddCgpa("");
    setAddPassword("");
    setAddIsAdmin(false);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!addName.trim()) {
      alert("Name is required");
      return;
    }

    if (!addUsername.trim()) {
      alert("Username is required");
      return;
    }

    if (!addDateOfBirth) {
      alert("Date of birth is required");
      return;
    }

    if (!addCity.trim()) {
      alert("City is required");
      return;
    }

    if (addCgpa === "" || Number(addCgpa) < 0 || Number(addCgpa) > 10) {
      alert("CGPA must be between 0 and 10");
      return;
    }

    if (!addPassword) {
      alert("Password is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: addName.trim(),
            username: addUsername.trim(),
            date_of_birth: addDateOfBirth,
            city: addCity.trim(),
            cgpa: Number(addCgpa),
            password: addPassword,
            is_admin: addIsAdmin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message || "Failed to create user"
        );
        return;
      }

      alert("User created successfully!");

      resetAddUserForm();
      setShowAddUser(false);

      await getUsers();
    } catch (error) {
      console.error(error);

      alert("Cannot connect to backend.");
    }
  };

  // =====================================================
  // DELETE USER
  // =====================================================

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${user.username}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message || "Failed to delete user"
        );
        return;
      }

      alert("User deleted successfully!");

      await getUsers();
    } catch (error) {
      console.error(error);

      alert("Cannot connect to backend.");
    }
  };

  // =====================================================
  // ADMIN LOGOUT
  // =====================================================

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");

    setAdminToken("");

    setUsers([]);

    setEditingUser(null);

    setShowAddUser(false);

    setPage("login");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const dateString = String(date).substring(0, 10);

    const parts = dateString.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateString;
  };

  // =====================================================
  // ADMIN LOGIN PAGE
  // =====================================================

  if (page === "adminLogin") {
    return (
      <div className="container">
        <div className="form-box">
          <h1>Admin Login</h1>

          <p>
            Login to manage registered users.
          </p>

          <form onSubmit={handleAdminLogin}>
            <div className="input-group">
              <label>
                Admin Username
              </label>

              <input
                type="text"
                value={adminUsername}
                onChange={(e) =>
                  setAdminUsername(e.target.value)
                }
                placeholder="Enter admin username"
                required
              />
            </div>

            <div className="input-group">
              <label>
                Admin Password
              </label>

              <input
                type="password"
                value={adminPassword}
                onChange={(e) =>
                  setAdminPassword(e.target.value)
                }
                placeholder="Enter admin password"
                required
              />
            </div>

            <button type="submit">
              Admin Login
            </button>
          </form>

          <p>
            <button
              className="link-button"
              onClick={() =>
                setPage("login")
              }
            >
              Back to User Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  if (page === "adminDashboard") {
    return (
      <div className="admin-dashboard">
        <header className="admin-header">
          <h1>
            Admin Dashboard
          </h1>

          <button
            className="logout-button"
            onClick={handleAdminLogout}
          >
            Logout
          </button>
        </header>

        <main className="admin-content">
          <div className="admin-title-row">
            <div>
              <h2>
                User Management
              </h2>

              <p>
                Manage registered users.
              </p>
            </div>

            <div>
              <button
                className="refresh-button"
                onClick={() => getUsers()}
              >
                Refresh Users
              </button>

              {" "}

              <button
                className="save-button"
                onClick={() => {
                  setShowAddUser(true);
                  setEditingUser(null);
                  resetAddUserForm();
                }}
              >
                + Add User
              </button>
            </div>
          </div>

          {/* =================================================
              ADD USER FORM
          ================================================= */}

          {showAddUser && (
            <div className="edit-user-box">
              <h2>
                Add New User
              </h2>

              <form onSubmit={handleAddUser}>
                <div className="input-group">
                  <label>
                    Name
                  </label>

                  <input
                    type="text"
                    value={addName}
                    onChange={(e) =>
                      setAddName(e.target.value)
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Username
                  </label>

                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) =>
                      setAddUsername(e.target.value)
                    }
                    placeholder="Enter username"
                    minLength={4}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={addDateOfBirth}
                    onChange={(e) =>
                      setAddDateOfBirth(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    value={addCity}
                    onChange={(e) =>
                      setAddCity(e.target.value)
                    }
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>
                    CGPA
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={addCgpa}
                    onChange={(e) =>
                      setAddCgpa(e.target.value)
                    }
                    placeholder="Enter CGPA (0-10)"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Password
                  </label>

                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) =>
                      setAddPassword(e.target.value)
                    }
                    placeholder="Enter password"
                    minLength={8}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="admin-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={addIsAdmin}
                      onChange={(e) =>
                        setAddIsAdmin(
                          e.target.checked
                        )
                      }
                    />

                    {" "}
                    Administrator
                  </label>
                </div>

                <div className="edit-buttons">
                  <button
                    type="submit"
                    className="save-button"
                  >
                    Create User
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowAddUser(false);
                      resetAddUserForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =================================================
              EDIT USER FORM
          ================================================= */}

          {editingUser && (
            <div className="edit-user-box">
              <h2>
                Edit User
              </h2>

              <form onSubmit={handleSaveEdit}>
                <div className="input-group">
                  <label>
                    Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Username
                  </label>

                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(e.target.value)
                    }
                    minLength={4}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) =>
                      setEditDateOfBirth(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) =>
                      setEditCity(e.target.value)
                    }
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>
                    CGPA
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={editCgpa}
                    onChange={(e) =>
                      setEditCgpa(e.target.value)
                    }
                    placeholder="Enter CGPA (0-10)"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    New Password
                  </label>

                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) =>
                      setEditPassword(e.target.value)
                    }
                    placeholder="Leave empty to keep current password"
                  />
                </div>

                <div className="admin-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={editIsAdmin}
                      onChange={(e) =>
                        setEditIsAdmin(
                          e.target.checked
                        )
                      }
                    />

                    {" "}
                    Administrator
                  </label>
                </div>

                <div className="edit-buttons">
                  <button
                    type="submit"
                    className="save-button"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =================================================
              USER COUNT
          ================================================= */}

          <div className="user-count">
            Total Users:
            {" "}
            <strong>
              {users.length}
            </strong>
          </div>

          {/* =================================================
              USER TABLE
          ================================================= */}

          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>
                    ID
                  </th>

                  <th>
                    Name
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Date of Birth
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    CGPA
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Admin
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.id}
                      </td>

                      <td>
                        <strong>
                          {user.name || "-"}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {user.username}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          user.date_of_birth
                        )}
                      </td>

                      <td>
                        {user.city || "-"}
                      </td>

                      <td>
                        {user.cgpa != null ? user.cgpa : "-"}
                      </td>

                      <td>
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        {user.is_admin ? (
                          <span className="admin-badge">
                            Admin
                          </span>
                        ) : (
                          <span className="user-badge">
                            User
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(user)
                          }
                        >
                          Edit
                        </button>

                        {" "}

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(user)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // USER DASHBOARD
  // =====================================================

  if (page === "dashboard") {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>
            My Dashboard
          </h1>

          <button
            className="logout-button"
            onClick={handleUserLogout}
          >
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          <h2>
            Welcome,{" "}
            {loggedInUser?.name ||
              loggedInUser?.username}
            ! 👋
          </h2>

          <p>
            You have successfully logged in.
          </p>

          <div className="dashboard-card">
            <h3>
              Account Information
            </h3>

            <p>
              <strong>User ID:</strong>{" "}
              {loggedInUser?.id}
            </p>

            <p>
              <strong>Name:</strong>{" "}
              {loggedInUser?.name || "-"}
            </p>

            <p>
              <strong>Username:</strong>{" "}
              {loggedInUser?.username}
            </p>

            <p>
              <strong>Date of Birth:</strong>{" "}
              {formatDate(
                loggedInUser?.date_of_birth
              )}
            </p>

            <p>
              <strong>City:</strong>{" "}
              {loggedInUser?.city || "-"}
            </p>

            <p>
              <strong>CGPA:</strong>{" "}
              {loggedInUser?.cgpa != null
                ? loggedInUser.cgpa
                : "-"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // REGISTER PAGE
  // =====================================================

  if (page === "register") {
    return (
      <div className="container">
        <div className="form-box">
          <h1>
            Create Account
          </h1>

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>
                Name
              </label>

              <input
                type="text"
                value={newName}
                onChange={(e) =>
                  setNewName(e.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="input-group">
              <label>
                Username
              </label>

              <input
                type="text"
                value={newUsername}
                onChange={(e) =>
                  setNewUsername(e.target.value)
                }
                placeholder="Enter username"
                minLength={4}
                maxLength={20}
                required
              />
            </div>

            <div className="input-group">
              <label>
                Date of Birth
              </label>

              <input
                type="date"
                value={newDateOfBirth}
                onChange={(e) =>
                  setNewDateOfBirth(e.target.value)
                }
                required
              />
            </div>

            <div className="input-group">
              <label>
                City
              </label>

              <input
                type="text"
                value={newCity}
                onChange={(e) =>
                  setNewCity(e.target.value)
                }
                placeholder="Enter your city"
                required
              />
            </div>
            <div className="input-group">
              <label>
                CGPA
              </label>

              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={newCgpa}
                onChange={(e) =>
                  setNewCgpa(e.target.value)
                }
                placeholder="Enter CGPA (0-10)"
                required
              />
            </div>

            <div className="input-group">
              <label>
                Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter password"
                minLength={8}
                maxLength={20}
                required
              />
            </div>

            <div className="password-rules">
              <p>
                Password must contain:
              </p>

              <ul>
                <li>
                  8–20 characters
                </li>

                <li>
                  One uppercase letter
                </li>

                <li>
                  One lowercase letter
                </li>

                <li>
                  One number
                </li>

                <li>
                  One special character
                </li>
              </ul>
            </div>

            <div className="input-group">
              <label>
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm password"
                required
              />
            </div>

            <button type="submit">
              Register
            </button>
          </form>

          <p>
            Already have an account?{" "}

            <button
              className="link-button"
              onClick={() =>
                setPage("login")
              }
            >
              Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // USER LOGIN PAGE
  // =====================================================

  return (
    <div className="container">
      <div className="form-box">
        <h1>
          Login
        </h1>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit">
            Login
          </button>
        </form>

        <p>
          New user?{" "}

          <button
            className="link-button"
            onClick={() =>
              setPage("register")
            }
          >
            Create Account
          </button>
        </p>

        <hr />

        <button
          className="admin-login-link"
          onClick={() =>
            setPage("adminLogin")
          }
        >
          Admin Login
        </button>
      </div>
    </div>
  );
}

export default App