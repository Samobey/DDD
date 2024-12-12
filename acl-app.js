const express = require("express");
const acl = require("acl");

// Using memory backend
acl = new acl(new acl.memoryBackend());

const app = express();
const port = 3000;

// Define roles and permissions
acl.allow([
  {
    roles: ["guest", "member"],
    allows: [
      { resources: "blogs", permissions: "get" },
      { resources: ["forums", "news"], permissions: ["get", "put", "delete"] },
    ],
  },
  {
    roles: ["gold", "silver"],
    allows: [
      { resources: "cash", permissions: ["sell", "exchange"] },
      { resources: ["account", "deposit"], permissions: ["put", "delete"] },
    ],
  },
]);
acl.addUserRoles("joed", "guest");

// Middleware to check ACL
function checkPermissions(resource, action) {
  return function (req, res, next) {
    const userRole = req.query.role; // assuming role is passed as query parameter
    console.log(`Role: ${userRole}, Resource: ${resource}, Action: ${action}`);

    acl.isAllowed(userRole, resource, action, (err, allowed) => {
      if (err) {
        console.error("Error checking permissions", err);
        res.status(500).send("Error checking permissions");
      } else if (allowed) {
        console.log("Access granted");
        next();
      } else {
        console.log("Access denied");
        res.status(403).send("Forbidden");
      }
    });
  };
}

// Routes
app.get("/assignRole", (req, res) => {
  const userId = req.query.user;
  const role = req.query.role;

  acl.addUserRoles(userId, role, (err) => {
    if (err) {
      res.status(500).send("Error assigning role");
    } else {
      res.send(`Assigned role ${role} to user ${userId}`);
    }
  });
});

app.get("/", checkPermissions("blogs", "get"), (req, res) => {
  res.send("Welcome to the admin panel");
});

app.post("/admin", checkPermissions("/admin", "post"), (req, res) => {
  res.send("Admin action successful");
});

app.get("/profile", checkPermissions("/profile", "get"), (req, res) => {
  res.send("Here is your profile");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
