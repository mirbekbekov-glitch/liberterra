function webRegisteredUserContext_(payload) {
    if (!emailAuthAuthorized_(payload)) return { ok: false, role: "guest", error: "unauthorized" };
      const webUserId = cleanText_(payload.web_user_id);
        const row = passwordAccounts_().find(function(item) { return cleanText_(item.web_user_id) === webUserId; });
          if (!row || !passwordAccountActive_(row, row._account_type) || !authorizedUserRow_(webUserId)) return { ok: false, role: "guest", registered: false, error: "registration_required" };
            const telegramId = cleanText_(row.telegram_id);
              if (!telegramId) return { ok: false, role: "guest", registered: false, error: "account_not_linked" };
                const properties = PropertiesService.getScriptProperties();
                  const adminId = cleanText_(properties.getProperty("ADMIN_TELEGRAM_ID") || properties.getProperty("ADMIN_CHAT_ID"));
                    return { ok: true, role: row._account_type === "Агент" ? "approved" : "user", telegramId: telegramId, name: cleanText_(row["Имя"]) || "Пользователь", phone: cleanText_(row["Телефон"]), accountType: row._account_type || cleanText_(row["Тип"]) || "Пользователь", registered: true, isAdmin: Boolean(adminId && adminId === telegramId), webUserId: webUserId };
                    }
