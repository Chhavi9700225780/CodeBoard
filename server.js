@@ .. @@
 const path = require('path');
 const server = http.createServer(app);
 
-const io = new Server(server);
+const io = new Server(server, {
+    cors: {
+        origin: "*",
+        methods: ["GET", "POST"]
+    },
+    pingTimeout: 60000,
+    pingInterval: 25000
+});
 
 app.use(express.static('build'));