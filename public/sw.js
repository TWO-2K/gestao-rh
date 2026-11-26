self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const url = payload.url || "/notificacoes";

  event.waitUntil(
    self.registration.showNotification(payload.titulo, {
      body: payload.mensagem,
      icon: "/brand/mais-barato-logo.png",
      badge: "/brand/mais-barato-logo.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notificacoes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clientList.length > 0 && "focus" in clientList[0]) {
        clientList[0].navigate(url);
        return clientList[0].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
