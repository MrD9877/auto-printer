import { networkInterfaces } from "os";

export function getNetworkIP(port: number) {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  console.log(results);
  const ips: string[] = [];
  Object.values(results)
    .flat()
    .forEach((ip) => {
      const url = `http://${ip}:${port}`;
      console.log(`🌐 Network:${url}`);
      ips.push(url);
    });

  return ips;
}

// Usage in your server
// app.listen(port, "0.0.0.0", () => {
//   const networkIPs = getNetworkIP();
//   console.log(`✅ Server started on port ${port}`);
//   console.log(`📍 Local: http://localhost:${port}`);

//   Object.values(networkIPs)
//     .flat()
//     .forEach((ip) => {
//       console.log(`🌐 Network: http://${ip}:${port}`);
//     });
// });
