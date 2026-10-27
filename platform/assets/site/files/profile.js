(()=>{if(document.querySelector('.profile-v2-layout'))return;if(!document.getElementById('liberterra-v20-global-styles')){const l=document.createElement('link');l.id='liberterra-v20-global-styles';l.rel='stylesheet';l.href='/v20-global.css';document.head.append(l)}if(!document.getElementById('liberterra-profile-v2-styles')){const s=document.createElement('style');s.id='liberterra-profile-v2-styles';s.textContent="/* profile-v2.css — New profile/dashboard layout.\n   Loaded AFTER v20-global.css on the profile page. */\n\n/* ── Layout ── */\n.profile-v2-layout {\n  display: flex;\n  min-height: 100vh;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n.profile-v2-sidebar {\n  width: 260px;\n  flex-shrink: 0;\n  border-right: 1px solid var(--v20-line);\n  padding: 24px 0;\n  position: sticky;\n  top: 0;\n  height: 100vh;\n  overflow-y: auto;\n  display: flex;\n  flex-direction: column;\n}\n.profile-v2-main {\n  flex: 1;\n  min-width: 0;\n  padding: 24px 32px 48px;\n}\n\n/* ── Sidebar ── */\n.pv2-sidebar-brand {\n  padding: 0 20px 20px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font: 700 18px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-accent);\n  letter-spacing: -0.02em;\n  text-decoration: none;\n}\n.pv2-sidebar-brand .dot {\n  width: 6px; height: 6px;\n  border-radius: 50%;\n  background: var(--v20-accent-secondary);\n}\n.pv2-sidebar-section {\n  padding: 8px 12px 4px;\n  font: 600 11px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  margin-top: 16px;\n}\n.pv2-sidebar-section:first-of-type { margin-top: 0; }\n.pv2-sidebar-nav {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.pv2-sidebar-nav li a {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 8px 16px;\n  margin: 1px 8px;\n  border-radius: 6px;\n  color: var(--v20-muted);\n  text-decoration: none;\n  font: 500 13.5px/1.3 'Segoe UI', Arial, sans-serif;\n  transition: background 150ms ease, color 150ms ease;\n}\n.pv2-sidebar-nav li a:hover {\n  background: var(--v20-accent-soft);\n  color: var(--v20-ink);\n}\n.pv2-sidebar-nav li a.active {\n  background: var(--v20-accent-soft);\n  color: var(--v20-accent);\n  font-weight: 600;\n}\n.pv2-sidebar-nav .badge {\n  margin-left: auto;\n  font: 600 12px/1 'Segoe UI', Arial, sans-serif;\n  background: var(--v20-accent-soft);\n  color: var(--v20-muted);\n  padding: 2px 7px;\n  border-radius: 999px;\n  min-width: 22px;\n  text-align: center;\n}\n.pv2-sidebar-nav li a.active .badge {\n  background: var(--v20-accent);\n  color: #fff;\n}\n.pv2-nav-icon {\n  width: 18px; height: 18px;\n  opacity: 0.6;\n  flex-shrink: 0;\n}\n.pv2-sidebar-nav li a.active .pv2-nav-icon { opacity: 1; }\n.pv2-sidebar-bottom {\n  margin-top: auto;\n  padding: 12px 20px;\n  border-top: 1px solid var(--v20-line);\n}\n.pv2-sidebar-user {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 6px 0;\n}\n.pv2-sidebar-avatar {\n  width: 32px; height: 32px;\n  border-radius: 50%;\n  background: var(--v20-accent);\n  color: #fff;\n  display: grid;\n  place-items: center;\n  font: 600 13px/1 'Segoe UI', Arial, sans-serif;\n  flex-shrink: 0;\n  overflow: hidden;\n}\n.pv2-sidebar-avatar img {\n  width: 100%; height: 100%;\n  object-fit: cover;\n}\n.pv2-sidebar-user-name {\n  font: 500 13px/1.2 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-ink);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.pv2-sidebar-user-role {\n  font: 400 12px/1.2 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n}\n.pv2-sidebar-back { display: inline-block; margin-top: 12px; font-size: 12px; color: var(--v20-accent); }\n.pv2-data-edit-note { color: var(--v20-muted); font-size: 12px; }\nbody.v20.profile-v2-runtime > header.site-header,\nbody.v20.profile-v2-runtime > .internal-back-row { display: none; }\n\n.pv2-agent-cta,\n.pv2-agent-status {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 18px 20px;\n  border-radius: 10px;\n  margin: 0 0 24px;\n}\n.pv2-agent-cta {\n  background: linear-gradient(135deg, var(--v20-accent), #a03050);\n  color: #fff;\n}\n.pv2-agent-cta-icon {\n  width: 44px;\n  height: 44px;\n  border-radius: 10px;\n  display: grid;\n  place-items: center;\n  flex: 0 0 auto;\n  background: #ffffff26;\n  font-size: 24px;\n}\n.pv2-agent-cta-text,\n.pv2-agent-status-text { flex: 1; min-width: 0; }\n.pv2-agent-cta-text strong,\n.pv2-agent-status-text strong { display: block; font-size: 15px; }\n.pv2-agent-cta-text span,\n.pv2-agent-status-text span { display: block; margin-top: 3px; font-size: 13px; }\n.pv2-agent-cta .pv2-btn { flex: 0 0 auto; background: #fff; color: var(--v20-accent); }\n.pv2-agent-status { background: var(--v20-accent-soft); border: 1px solid var(--v20-line); }\n.pv2-agent-status-icon {\n  width: 40px;\n  height: 40px;\n  flex: 0 0 auto;\n  border-radius: 50%;\n  display: grid;\n  place-items: center;\n  background: #fef4ea;\n  color: #ad611c;\n  font-weight: 700;\n}\n.pv2-agent-status-icon.approved { background: #edf7f0; color: #1a7a3a; }\n.pv2-agent-status-icon.rejected,\n.pv2-agent-status-icon.blocked { background: #fef2f1; color: #c4291c; }\n.pv2-agent-status-text span { color: var(--v20-muted); }\n@media (max-width: 550px) {\n  .pv2-agent-cta { flex-wrap: wrap; }\n  .pv2-agent-cta .pv2-btn { width: 100%; }\n}\n.pv2-soon-badge {\n  margin-left: auto;\n  font: 500 10px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  background: var(--v20-accent-soft);\n  padding: 2px 6px;\n  border-radius: 999px;\n}\n\n/* ── Profile Header Card ── */\n.pv2-profile-header {\n  display: flex;\n  align-items: flex-start;\n  gap: 20px;\n  padding: 20px 24px;\n  background: var(--v20-paper);\n  border: 1px solid var(--v20-line);\n  border-radius: 10px;\n  margin-bottom: 24px;\n}\n.pv2-avatar-wrapper { position: relative; flex-shrink: 0; }\n.pv2-avatar {\n  width: 72px; height: 72px;\n  border-radius: 50%;\n  background: var(--v20-accent);\n  color: #fff;\n  display: grid;\n  place-items: center;\n  font: 600 24px/1 'Segoe UI', Arial, sans-serif;\n  overflow: hidden;\n  position: relative;\n}\n.pv2-avatar img {\n  width: 100%; height: 100%;\n  object-fit: cover;\n}\n.pv2-avatar-upload {\n  position: absolute;\n  bottom: -2px; right: -2px;\n  width: 26px; height: 26px;\n  border-radius: 50%;\n  background: var(--v20-paper);\n  border: 2px solid var(--v20-line);\n  display: grid;\n  place-items: center;\n  cursor: pointer;\n  transition: background 150ms ease;\n}\n.pv2-avatar-upload:hover { background: var(--v20-accent-soft); }\n.pv2-avatar-upload svg { width: 12px; height: 12px; color: var(--v20-muted); }\n.pv2-profile-info { flex: 1; min-width: 0; padding-top: 4px; }\n.pv2-profile-name {\n  font: 600 20px/1.2 'Segoe UI', Arial, sans-serif;\n  letter-spacing: -0.01em;\n  margin: 0;\n  color: var(--v20-ink);\n}\n.pv2-profile-meta {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px 12px;\n  margin-top: 6px;\n  font: 400 13px/1.3 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n}\n.pv2-role-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  background: var(--v20-accent-soft);\n  color: var(--v20-accent);\n  font-weight: 600;\n  font-size: 12px;\n}\n.pv2-profile-phone {\n  color: var(--v20-muted);\n  text-decoration: none;\n}\n.pv2-profile-phone:hover { color: var(--v20-accent); }\n.pv2-profile-actions {\n  display: flex;\n  gap: 8px;\n  flex-shrink: 0;\n  padding-top: 8px;\n}\n\n/* ── Buttons ── */\n.pv2-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 8px 16px;\n  border-radius: 6px;\n  font: 500 13px/1 'Segoe UI', Arial, sans-serif;\n  transition: all 150ms ease;\n  white-space: nowrap;\n  border: none;\n  cursor: pointer;\n}\n.pv2-btn svg { width: 14px; height: 14px; }\n.pv2-btn-primary {\n  background: var(--v20-accent);\n  color: #fff;\n}\n.pv2-btn-primary:hover { background: var(--v20-accent-hover); }\n.pv2-btn-secondary {\n  background: var(--v20-accent-soft);\n  color: var(--v20-ink);\n  border: 1px solid var(--v20-line);\n}\n.pv2-btn-secondary:hover { background: var(--v20-line); }\n\n/* ── Stats Grid ── */\n.pv2-stats-grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 12px;\n  margin-bottom: 24px;\n}\n.pv2-stat-card {\n  background: var(--v20-paper);\n  border: 1px solid var(--v20-line);\n  border-radius: 10px;\n  padding: 16px 18px;\n  cursor: pointer;\n  transition: border-color 150ms ease, box-shadow 150ms ease;\n  text-decoration: none;\n  display: block;\n  color: inherit;\n}\n.pv2-stat-card:hover {\n  border-color: var(--v20-field-line);\n  box-shadow: 0 1px 3px rgba(0,0,0,0.06);\n}\n.pv2-stat-card.highlight { border-left: 3px solid var(--v20-accent); }\n.pv2-stat-value {\n  font: 700 28px/1 'Segoe UI', Arial, sans-serif;\n  letter-spacing: -0.02em;\n  font-variant-numeric: tabular-nums;\n  color: var(--v20-ink);\n}\n.pv2-stat-label {\n  font: 500 13px/1.2 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  margin-top: 4px;\n}\n.pv2-stat-sub {\n  font: 400 12px/1.2 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-field-line);\n  margin-top: 2px;\n}\n\n/* ── Quick Actions ── */\n.pv2-quick-actions {\n  display: flex;\n  gap: 10px;\n  margin-bottom: 24px;\n}\n.pv2-action-btn {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 14px 18px;\n  background: var(--v20-paper);\n  border: 1px solid var(--v20-line);\n  border-radius: 10px;\n  transition: all 150ms ease;\n  text-decoration: none;\n  color: var(--v20-ink);\n  cursor: pointer;\n}\n.pv2-action-btn:hover {\n  border-color: var(--v20-field-line);\n  box-shadow: 0 1px 3px rgba(0,0,0,0.06);\n}\n.pv2-action-btn.primary {\n  background: var(--v20-accent);\n  border-color: var(--v20-accent);\n  color: #fff;\n}\n.pv2-action-btn.primary:hover { background: var(--v20-accent-hover); }\n.pv2-action-icon {\n  width: 36px; height: 36px;\n  border-radius: 6px;\n  display: grid;\n  place-items: center;\n  flex-shrink: 0;\n}\n.pv2-action-btn.primary .pv2-action-icon { background: rgba(255,255,255,0.15); }\n.pv2-action-btn:not(.primary) .pv2-action-icon { background: var(--v20-accent-soft); }\n.pv2-action-icon svg { width: 18px; height: 18px; }\n.pv2-action-text strong {\n  display: block;\n  font: 600 14px/1.3 'Segoe UI', Arial, sans-serif;\n}\n.pv2-action-text span {\n  font: 400 12px/1.3 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n}\n.pv2-action-btn.primary .pv2-action-text span { color: rgba(255,255,255,0.7); }\n\n/* ── Section ── */\n.pv2-section { margin-bottom: 24px; }\n.pv2-section-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 12px;\n}\n.pv2-section-title {\n  font: 600 15px/1.3 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-ink);\n}\n.pv2-section-link {\n  font: 500 13px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-accent);\n  text-decoration: none;\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.pv2-section-link:hover { text-decoration: underline; }\n\n/* ── Personal Data Grid ── */\n.pv2-data-grid {\n  background: var(--v20-paper);\n  border: 1px solid var(--v20-line);\n  border-radius: 10px;\n  padding: 18px 20px;\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 16px 32px;\n}\n.pv2-data-label {\n  font: 400 12px/1.2 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  margin-bottom: 4px;\n}\n.pv2-data-value {\n  font: 500 14px/1.3 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-ink);\n}\n.pv2-data-value.empty { color: var(--v20-muted); }\n.pv2-data-value.linked {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.pv2-data-full {\n  grid-column: 1 / -1;\n  padding-top: 8px;\n  border-top: 1px solid var(--v20-line);\n}\n.pv2-cert-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  font: 500 11px/1 'Segoe UI', Arial, sans-serif;\n  color: #1a7a3a;\n  background: #edf7f0;\n  padding: 2px 8px;\n  border-radius: 999px;\n}\nhtml[data-theme=\"dark\"] .pv2-cert-badge {\n  color: #4ade80;\n  background: #0f2218;\n}\n.pv2-cert-icon {\n  width: 16px; height: 16px;\n  color: var(--v20-accent);\n}\n\n/* ── Avatar Modal ── */\n.pv2-modal-overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.5);\n  z-index: 100;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 200ms ease;\n}\n.pv2-modal-overlay.open {\n  opacity: 1;\n  pointer-events: auto;\n}\n.pv2-modal {\n  background: var(--v20-paper);\n  border-radius: 12px;\n  width: 100%;\n  max-width: 400px;\n  overflow: hidden;\n  transform: translateY(8px);\n  transition: transform 200ms ease;\n}\n.pv2-modal-overlay.open .pv2-modal { transform: translateY(0); }\n.pv2-modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 16px 20px;\n  border-bottom: 1px solid var(--v20-line);\n}\n.pv2-modal-header h3 {\n  font: 600 16px/1.2 'Segoe UI', Arial, sans-serif;\n  margin: 0;\n}\n.pv2-modal-close {\n  width: 28px; height: 28px;\n  border-radius: 6px;\n  display: grid;\n  place-items: center;\n  color: var(--v20-muted);\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n.pv2-modal-close:hover { background: var(--v20-accent-soft); }\n.pv2-modal-body { padding: 20px; }\n.pv2-avatar-editor {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 16px;\n}\n.pv2-avatar-preview {\n  width: 120px; height: 120px;\n  border-radius: 50%;\n  background: var(--v20-accent-soft);\n  overflow: hidden;\n  display: grid;\n  place-items: center;\n  border: 3px solid var(--v20-line);\n}\n.pv2-avatar-preview img {\n  width: 100%; height: 100%;\n  object-fit: cover;\n}\n.pv2-avatar-preview .initials {\n  font: 600 40px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n}\n.pv2-upload-zone {\n  width: 100%;\n  padding: 24px;\n  border: 2px dashed var(--v20-line);\n  border-radius: 10px;\n  text-align: center;\n  cursor: pointer;\n  transition: border-color 150ms ease;\n}\n.pv2-upload-zone:hover { border-color: var(--v20-accent); }\n.pv2-upload-zone p {\n  font: 400 13px/1.4 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  margin: 4px 0 0;\n}\n.pv2-upload-zone strong { color: var(--v20-accent); }\n.pv2-modal-footer {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n  padding: 16px 20px;\n  border-top: 1px solid var(--v20-line);\n}\n.pv2-zoom-control {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n}\n.pv2-zoom-control input[type=range] {\n  flex: 1;\n  accent-color: var(--v20-accent);\n}\n.pv2-zoom-label {\n  font: 500 12px/1 'Segoe UI', Arial, sans-serif;\n  color: var(--v20-muted);\n  white-space: nowrap;\n}\n\n/* ── Toast ── */\n.pv2-toast {\n  position: fixed;\n  bottom: 24px;\n  left: 50%;\n  transform: translateX(-50%) translateY(80px);\n  background: var(--v20-ink);\n  color: var(--v20-paper);\n  padding: 10px 20px;\n  border-radius: 999px;\n  font: 500 13px/1.3 'Segoe UI', Arial, sans-serif;\n  z-index: 200;\n  transition: transform 300ms ease;\n  pointer-events: none;\n}\n.pv2-toast.show {\n  transform: translateX(-50%) translateY(0);\n}\n\n/* ── Mobile ── */\n.pv2-mobile-header { display: none; }\n.pv2-mobile-nav { display: none; }\n\n@media (max-width: 768px) {\n  .profile-v2-sidebar { display: none; }\n  .profile-v2-layout { flex-direction: column; }\n  .profile-v2-main { padding: 16px 16px 96px; }\n  .pv2-mobile-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 12px 16px;\n    border-bottom: 1px solid var(--v20-line);\n    background: var(--v20-paper);\n    position: sticky;\n    top: 0;\n    z-index: 50;\n  }\n  .pv2-mobile-brand {\n    font: 700 16px/1 'Segoe UI', Arial, sans-serif;\n    color: var(--v20-accent);\n    letter-spacing: -0.02em;\n    display: flex;\n    align-items: center;\n    gap: 6px;\n  }\n  .pv2-mobile-brand .dot {\n    width: 5px; height: 5px;\n    border-radius: 50%;\n    background: var(--v20-accent-secondary);\n  }\n  .pv2-mobile-user-btn {\n    width: 32px; height: 32px;\n    border-radius: 50%;\n    background: var(--v20-accent);\n    color: #fff;\n    display: grid;\n    place-items: center;\n    font: 600 12px/1 'Segoe UI', Arial, sans-serif;\n    border: none;\n    cursor: pointer;\n    overflow: hidden;\n  }\n  .pv2-mobile-user-btn img {\n    width: 100%; height: 100%;\n    object-fit: cover;\n  }\n  .pv2-mobile-nav {\n    display: flex;\n    position: fixed;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    background: var(--v20-paper);\n    border-top: 1px solid var(--v20-line);\n    padding: 6px 8px;\n    z-index: 50;\n    justify-content: space-around;\n  }\n  .pv2-mobile-nav a {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 2px;\n    padding: 6px 12px;\n    border-radius: 6px;\n    font: 500 10px/1.2 'Segoe UI', Arial, sans-serif;\n    color: var(--v20-muted);\n    text-decoration: none;\n    transition: color 150ms ease;\n  }\n  .pv2-mobile-nav a.active { color: var(--v20-accent); }\n  .pv2-mobile-nav a svg { width: 20px; height: 20px; }\n  .pv2-profile-header {\n    flex-direction: column;\n    align-items: center;\n    text-align: center;\n    gap: 12px;\n    padding: 20px;\n  }\n  .pv2-profile-meta { justify-content: center; }\n  .pv2-profile-actions { width: 100%; justify-content: center; }\n  .pv2-stats-grid { grid-template-columns: repeat(2, 1fr); }\n  .pv2-quick-actions { flex-direction: column; }\n  .pv2-data-grid { grid-template-columns: 1fr; gap: 14px; }\n}\n\n@media (max-width: 440px) {\n  .pv2-stats-grid { gap: 8px; }\n  .pv2-stat-card { padding: 12px 14px; }\n  .pv2-stat-value { font-size: 24px; }\n}\n\n/* Profile navigation and compact language control. */\nbody.v20.profile-page .pv2-topbar,\nbody.v20.profile-v2-runtime .pv2-topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  min-height: 44px;\n  margin-bottom: 18px;\n}\nbody.v20.profile-page .pv2-back-to-site,\nbody.v20.profile-v2-runtime .pv2-back-to-site {\n  color: var(--v20-accent);\n  font-size: 14px;\n  font-weight: 700;\n  text-decoration: none;\n}\nbody.v20.profile-page .pv2-back-to-site:hover,\nbody.v20.profile-v2-runtime .pv2-back-to-site:hover { text-decoration: underline; }\nbody.v20.profile-page .pv2-back-to-site:focus-visible,\nbody.v20.profile-v2-runtime .pv2-back-to-site:focus-visible,\nbody.v20.profile-page .pv2-language-picker select:focus-visible,\nbody.v20.profile-v2-runtime .pv2-language-picker select:focus-visible {\n  outline: 2px solid var(--v20-accent);\n  outline-offset: 3px;\n}\nbody.v20.profile-page .pv2-language-picker,\nbody.v20.profile-v2-runtime .pv2-language-picker {\n  position: static;\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  border: 0;\n  padding: 0;\n  background: transparent;\n  color: var(--v20-muted);\n  font-size: 13px;\n  white-space: nowrap;\n}\nbody.v20.profile-page .pv2-language-picker select,\nbody.v20.profile-v2-runtime .pv2-language-picker select {\n  min-width: 150px;\n  height: 40px;\n  padding: 0 30px 0 12px;\n  border: 1px solid var(--v20-line);\n  border-radius: 10px;\n  background: var(--v20-surface, #fff);\n  color: var(--v20-text);\n  font: inherit;\n  cursor: pointer;\n}\n@media (max-width: 480px) {\n  body.v20.profile-page .pv2-topbar,\n  body.v20.profile-v2-runtime .pv2-topbar { gap: 8px; margin-bottom: 10px; }\n  body.v20.profile-page .pv2-language-picker span,\n  body.v20.profile-v2-runtime .pv2-language-picker span { display: none; }\n  body.v20.profile-page .pv2-language-picker select,\n  body.v20.profile-v2-runtime .pv2-language-picker select { min-width: 130px; max-width: 45vw; }\n}\n";document.head.append(s)}})();
(() => {
  function ensureV2Layout() {
    if (document.querySelector(".profile-v2-layout")) return;
    const main = document.querySelector("main.profile-main");
    if (!main || !main.querySelector("#profileCard") || !main.querySelector("#profileFavoritesGrid")) return;
    document.body.classList.add("v20", "profile-v2-runtime");
    const mobileHeader = document.createElement("div");
    mobileHeader.className = "pv2-mobile-header";
    mobileHeader.innerHTML = '<a href="/" class="pv2-mobile-brand">Liberterra <span class="dot"></span></a><a href="#profileCard" class="pv2-mobile-user-btn" aria-label="К профилю">Л</a>';
    const layout = document.createElement("div");
    layout.className = "profile-v2-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "profile-v2-sidebar";
    sidebar.setAttribute("aria-label", "Личный кабинет");
    sidebar.innerHTML = '<a href="/" class="pv2-sidebar-brand">Liberterra <span class="dot"></span></a><div class="pv2-sidebar-section">Основное</div><ul class="pv2-sidebar-nav"><li><a href="/profile" class="active" aria-current="page"><span class="pv2-nav-icon" aria-hidden="true">▦</span>Обзор</a></li><li><a href="/my-listings.html"><span class="pv2-nav-icon" aria-hidden="true">⌂</span>Мои объекты<span class="badge" data-count="objects">0</span></a></li><li><a href="/my-requests.html"><span class="pv2-nav-icon" aria-hidden="true">⌕</span>Мои заявки<span class="badge" data-count="requests">0</span></a></li><li><a href="#profileFavorites"><span class="pv2-nav-icon" aria-hidden="true">♡</span>Избранное<span class="badge" data-count="favorites">0</span></a></li><li><a href="/agent-cabinet.html"><span class="pv2-nav-icon" aria-hidden="true">▣</span>Рабочая база CRM</a></li></ul><div class="pv2-sidebar-section">Инструменты</div><ul class="pv2-sidebar-nav"><li><a href="/viewing-history.html"><span class="pv2-nav-icon" aria-hidden="true">◷</span>История просмотров</a></li><li><a href="https://t.me/Liberterra_kg_bot?start=support" target="_blank" rel="noopener"><span class="pv2-nav-icon" aria-hidden="true">?</span>Поддержка</a></li></ul><div class="pv2-sidebar-bottom"><div class="pv2-sidebar-user"><div class="pv2-sidebar-avatar" aria-hidden="true">Л</div><div><div class="pv2-sidebar-user-name">Пользователь</div><div class="pv2-sidebar-user-role">Клиент</div></div></div></div>';
    main.before(mobileHeader, layout);
    layout.append(sidebar, main);
    main.className = "profile-v2-main";
    main.setAttribute("role", "main");
    const topbar = document.createElement("div");
    topbar.innerHTML = "<div class=\"pv2-topbar\">\n        <a href=\"/\" class=\"pv2-back-to-site\">← На главную</a>\n        <label class=\"pv2-language-picker language-switcher\"><span>Язык</span>\n          <select id=\"profileLanguage\" aria-label=\"Выбор языка\">\n            <option value=\"ru\">RU · Русский</option>\n            <option value=\"ky\">KG · Кыргызча</option>\n            <option value=\"en\">EN · English</option>\n            <option value=\"zh\">中文</option>\n          </select>\n        </label>\n      </div>";
    main.prepend(topbar.firstElementChild);
    const hero = main.querySelector(".profile-hero");
    if (hero) { hero.className = "pv2-section"; hero.innerHTML = '<h1 class="pv2-section-title">Мой профиль</h1>'; }
    const favorites = main.querySelector("#profileFavorites");
    favorites?.classList.add("pv2-section");
    const mobileNav = document.createElement("nav");
    mobileNav.className = "pv2-mobile-nav";
    mobileNav.setAttribute("aria-label", "Разделы кабинета");
    mobileNav.innerHTML = '<a href="/profile" class="active" aria-current="page"><span aria-hidden="true">▦</span>Обзор</a><a href="/my-listings.html"><span aria-hidden="true">⌂</span>Объекты</a><a href="/my-requests.html"><span aria-hidden="true">⌕</span>Заявки</a><a href="/agent-cabinet.html"><span aria-hidden="true">▣</span>CRM</a>';
    layout.after(mobileNav);
  }
  ensureV2Layout();
  const profileNode = document.querySelector("#profileCard");
  const favoritesNode = document.querySelector("#profileFavoritesGrid");
  const rows = Array.isArray(window.LIBERTERRA_LOCAL_OBJECTS) ? window.LIBERTERRA_LOCAL_OBJECTS : [];
  const clean = (value) => String(value || "").trim();
  const PHOTO_DELIVERY_ORIGIN = "https://hidden-pine-cbff.mirbekbekov.workers.dev";
  const escapeHtml = (value) => clean(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const photo = (value) => {
    const source = clean(value).split(/\s*(?:\||\n)\s*/).filter(Boolean)[0] || "";
    const filename = source.split(/[?#]/, 1)[0].split("/").pop();
    return /^object_[^/]+\.(?:jpe?g|png|webp)$/i.test(filename || "")
      ? `${PHOTO_DELIVERY_ORIGIN}/uploads/${encodeURIComponent(filename)}`
      : source;
  };
  const objectById = new Map(rows.map((row) => [clean(row.id), row]));
  const profileCacheKey = "liberterra-profile-v2-view";
  let loading = false;
  let loaded = false;
  let profileUser = null;

  function renderAgentApplication() {
    profileNode.querySelector("[data-agent-application-status]")?.remove();
    if (!profileUser) return;
    const state = window.LiberterraAgentAccess?.getState();
    // The Telegram onboarding state is not the status of a website agent account.
    if (profileUser.account_type === "Агент" && !state?.isTelegramSession) return;
    const role = state?.role;
    if (profileUser.account_type !== "Агент" && !["pending", "approved", "rejected", "blocked"].includes(role)) return;
    const labels = {
      guest: ["Анкета не заполнена", "Заполните анкету агента. После одобрения ваш профиль появится в списке агентов."],
      pending: ["На проверке", "Анкета отправлена администратору. Повторно отправлять её не нужно."],
      approved: ["Подтверждён", "Ваша анкета агента одобрена."],
      rejected: ["Анкета отклонена", "Уточните причину у администратора. Вы можете исправить и отправить анкету повторно."],
      blocked: ["Доступ ограничен", "Обратитесь к администратору."],
    };
    const checking = !state || state.checking;
    const failed = !checking && (state.checkError || !labels[role]);
    const [title, description] = checking ? ["Проверяем статус анкеты…", ""]
      : failed ? ["Статус временно недоступен", "Повторите проверку. Это не означает, что анкета отсутствует."] : labels[role];
    const section = document.createElement("section");
    section.dataset.agentApplicationStatus = "true";
    section.className = "pv2-agent-status";
    section.setAttribute("aria-live", "polite");
    section.innerHTML = `<span class="pv2-agent-status-icon ${escapeHtml(failed ? "rejected" : role || "pending")}" aria-hidden="true">${failed || ["rejected", "blocked"].includes(role) ? "!" : role === "approved" ? "✓" : "◷"}</span><span class="pv2-agent-status-text"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></span>`;
    if (failed || (!checking && ["guest", "rejected"].includes(role))) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "profile-primary";
      button.setAttribute(failed ? "data-agent-retry" : "data-agent-open", "");
      button.textContent = failed ? "Повторить проверку" : role === "rejected" ? "Исправить анкету" : "Заполнить анкету агента";
      section.append(button);
    }
    (profileNode.querySelector(".pv2-quick-actions") || profileNode.querySelector("[data-profile-logout]") || profileNode).before(section);
  }

  try {
    const cached = JSON.parse(sessionStorage.getItem(profileCacheKey) || "null");
    if (cached?.profileHtml) profileNode.innerHTML = cached.profileHtml;
    if (cached?.favoritesHtml) favoritesNode.innerHTML = cached.favoritesHtml;
  } catch (_) {}

  function renderFavorites(ids) {
    const objects = ids.map((id) => objectById.get(String(id))).filter(Boolean);
    favoritesNode.innerHTML = objects.length ? objects.map((item) => `
      <a class="profile-favorite-card" href="/object?id=${encodeURIComponent(item.id)}">
        ${photo(item.photo_url) ? `<img src="${escapeHtml(photo(item.photo_url))}" alt="" loading="lazy" decoding="async">` : '<span class="object-map-no-photo">Фото готовится</span>'}
        <span><strong>${escapeHtml(item.price || "Цена по запросу")}</strong><b>${escapeHtml(item.title || "Объект недвижимости")}</b><small>${escapeHtml(item.district || "Бишкек")}</small></span>
      </a>`).join("") : '<div class="profile-empty"><strong>Избранных объектов пока нет</strong><span>Нажмите ♡ в каталоге — сохранённый объект появится здесь на всех ваших устройствах.</span><a href="/">Перейти в каталог</a></div>';
  }

  async function loadProfile({ force = false } = {}) {
    const hasTelegramSession = Boolean(window.LiberterraAgentAccess?.hasUserSession());
    let hasWebSession = !hasTelegramSession && Boolean(window.LiberterraUserAccess?.isRegistered?.());
    if (!hasTelegramSession && !hasWebSession && window.LiberterraUserAccess?.check) {
      hasWebSession = await window.LiberterraUserAccess.check();
    }
    if (loading || (loaded && !force) || (!hasTelegramSession && !hasWebSession)) return;
    loading = true;
    try {
      const response = hasTelegramSession
        ? await window.LiberterraAgentAccess.request("get_user_profile", {})
        : await fetch("/api/user-access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "web_profile" }) }).then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.ok) throw new Error(body.error || "profile_unavailable");
          return body;
        });
      const user = response.user || {};
      profileUser = user;
      let localFavorites = [];
      try { localFavorites = JSON.parse(localStorage.getItem("liberterra_favorite_objects_v1") || "[]").map(String); } catch (_) {}
      const remoteFavorites = (response.favorite_object_ids || []).map(String);
      const favorites = [...new Set([...localFavorites, ...remoteFavorites])];
      const remoteSet = new Set(remoteFavorites);
      const unsyncedFavorites = localFavorites.filter((id) => !remoteSet.has(id));
      if (unsyncedFavorites.length) {
        try {
          await window.LiberterraAgentAccess.request("set_user_favorites", { object_ids: unsyncedFavorites });
        } catch (_) {}
      }
      localStorage.setItem("liberterra_favorite_objects_v1", JSON.stringify(favorites));
      const initial = clean(user.name).slice(0, 1).toUpperCase() || "L";
      const emailLink = hasTelegramSession ? '<button class="pv2-action-btn" type="button" data-link-telegram-account>Вход на сайт без Telegram</button>' : "";
      const phone = clean(user.phone);
      const email = clean(user.email);
      const agency = clean(user.agency);
      const specialization = clean(user.specialization);
      const certificate = clean(user.certificate_number);
      const registrationDate = user.created_at ? new Date(user.created_at) : null;
      const registrationLabel = registrationDate && !Number.isNaN(registrationDate.getTime())
        ? registrationDate.toLocaleDateString("ru", { day: "numeric", month: "short", year: "numeric" }) : "—";
      const activeCount = response.active_object_count == null ? "—" : Number(response.active_object_count);
      const isAgent = ["agent", "Агент", "admin", "Администратор"].includes(clean(user.account_type));
      const agentRole = window.LiberterraAgentAccess?.getState?.()?.role;
      const showAgentCta = !isAgent && !["pending", "approved", "rejected", "blocked"].includes(agentRole);
      const avatarEditorEnabled = Boolean(user.can_edit_photo && window.LiberterraAgentPhoto?.editor);
      const contactHtml = phone
        ? `<a class="pv2-profile-phone" href="tel:${escapeHtml(phone.replace(/[^+\d]/g, ""))}">${escapeHtml(phone)}</a>`
        : email ? `<span class="pv2-profile-phone">${escapeHtml(email)}</span>` : "";
      // CRM authorization is enforced by its API; profile labels can lag the
      // agent's actual access, so do not hide the entry based on account_type.
      profileNode.innerHTML = `
        <div class="pv2-profile-header">
          <div class="pv2-avatar-wrapper"><div class="pv2-avatar" aria-label="Фото профиля">${escapeHtml(initial)}</div></div>
          <div class="pv2-profile-info">
            <h2 class="pv2-profile-name">${escapeHtml(user.name || "Пользователь Liberterra")}</h2>
            <div class="pv2-profile-meta"><span class="pv2-role-badge">${escapeHtml(user.account_type || "Клиент")}</span>${contactHtml}</div>
          </div>
          ${avatarEditorEnabled ? '<div class="pv2-profile-actions"><button class="pv2-btn pv2-btn-secondary" type="button" data-pv2-avatar-edit>Изменить фото</button></div>' : ""}
        </div>
        <div class="pv2-stats-grid" aria-label="Статистика профиля">
          <a class="pv2-stat-card highlight" href="/my-listings.html"><div class="pv2-stat-value">${Number(response.own_object_count || 0)}</div><div class="pv2-stat-label">Мои объекты</div><div class="pv2-stat-sub">всего</div></a>
          <a class="pv2-stat-card" href="/my-listings.html"><div class="pv2-stat-value">${escapeHtml(activeCount)}</div><div class="pv2-stat-label">Активные</div><div class="pv2-stat-sub">${activeCount === "—" ? "данные пока недоступны" : "объявления"}</div></a>
          <a class="pv2-stat-card" href="/my-requests.html"><div class="pv2-stat-value">${Number(response.own_request_count || 0)}</div><div class="pv2-stat-label">Мои заявки</div><div class="pv2-stat-sub">на подбор</div></a>
          <a class="pv2-stat-card" href="#profileFavorites"><div class="pv2-stat-value">${favorites.length}</div><div class="pv2-stat-label">Избранное</div><div class="pv2-stat-sub">объектов</div></a>
        </div>
        ${showAgentCta ? '<div class="pv2-agent-cta"><div class="pv2-agent-cta-icon" aria-hidden="true">⌂</div><div class="pv2-agent-cta-text"><strong>Стать риелтором</strong><span>Создайте профиль агента и размещайте объекты</span></div><button class="pv2-btn" type="button" data-agent-open>Подать заявку</button></div>' : ""}
        <div class="pv2-quick-actions">
          <a class="pv2-action-btn primary" href="/add-object.html"><span class="pv2-action-icon" aria-hidden="true">＋</span><span class="pv2-action-text"><strong>Разместить объект</strong><span>Добавить в каталог</span></span></a>
          <a class="pv2-action-btn" href="/add-request.html"><span class="pv2-action-icon" aria-hidden="true">⌕</span><span class="pv2-action-text"><strong>Оставить заявку</strong><span>Запрос на подбор</span></span></a>
          <a class="pv2-action-btn" href="/agent-cabinet.html"><span class="pv2-action-icon" aria-hidden="true">▣</span><span class="pv2-action-text"><strong>Открыть CRM</strong><span>Рабочая база</span></span></a>
          ${emailLink}
        </div>
        <section class="pv2-section"><div class="pv2-section-header"><h3 class="pv2-section-title">Личные данные</h3><span class="pv2-data-edit-note" title="Пока нет подтверждённого API сохранения профиля">Редактирование появится позже</span></div>
          <div class="pv2-data-grid">
            <div><div class="pv2-data-label">Имя</div><div class="pv2-data-value">${escapeHtml(user.name || "Не указано")}</div></div>
            <div><div class="pv2-data-label">Email</div><div class="pv2-data-value">${escapeHtml(email || "Не указан")}</div></div>
            <div><div class="pv2-data-label">Телефон</div><div class="pv2-data-value">${escapeHtml(phone || "Не указан")}</div></div>
            <div><div class="pv2-data-label">Агентство</div><div class="pv2-data-value${agency ? "" : " empty"}">${escapeHtml(agency || "Не указано")}</div></div>
            ${specialization ? `<div><div class="pv2-data-label">Специализация</div><div class="pv2-data-value">${escapeHtml(specialization)}</div></div>` : ""}
            <div><div class="pv2-data-label">Telegram</div><div class="pv2-data-value">${user.telegram_id || hasTelegramSession ? "Привязан" : "Не привязан"}</div></div>
            <div><div class="pv2-data-label">Дата регистрации</div><div class="pv2-data-value">${escapeHtml(registrationLabel)}</div></div>
            ${certificate ? `<div class="pv2-data-full"><div class="pv2-data-label">Сертификат аттестации риэлтора</div><div class="pv2-data-value linked">№ ${escapeHtml(certificate)}</div></div>` : ""}
          </div>
        </section>
        <button class="profile-logout pv2-btn pv2-btn-secondary" type="button" data-profile-logout>Выйти из аккаунта</button>
        ${avatarEditorEnabled ? '<div class="pv2-modal-overlay" id="pv2AvatarModal" role="dialog" aria-modal="true" aria-label="Фото профиля" aria-hidden="true"><div class="pv2-modal"><div class="pv2-modal-header"><h3>Фото профиля</h3><button class="pv2-modal-close" type="button" data-pv2-avatar-close aria-label="Закрыть">×</button></div><div class="pv2-modal-body" data-pv2-avatar-editor-slot></div></div></div>' : ""}`;
      renderFavorites(favorites);
      const avatar = profileNode.querySelector(".pv2-avatar");
      window.LiberterraAgentPhoto?.show(avatar, user.avatar_url, user.name);
      const sidebarAvatar = document.querySelector(".pv2-sidebar-avatar");
      window.LiberterraAgentPhoto?.show(sidebarAvatar, user.avatar_url, user.name);
      const sidebarName = document.querySelector(".pv2-sidebar-user-name");
      const sidebarRole = document.querySelector(".pv2-sidebar-user-role");
      if (sidebarName) sidebarName.textContent = user.name || "Пользователь";
      if (sidebarRole) sidebarRole.textContent = user.account_type || "Клиент";
      for (const [key, count] of Object.entries({ objects: response.own_object_count || 0, requests: response.own_request_count || 0, favorites: favorites.length })) {
        const badge = document.querySelector(`.pv2-sidebar-nav .badge[data-count="${key}"]`);
        if (badge) badge.textContent = String(count);
      }
      try { sessionStorage.setItem(profileCacheKey, JSON.stringify({ profileHtml: profileNode.innerHTML, favoritesHtml: favoritesNode.innerHTML })); } catch (_) {}
      window.LiberterraAgentPhoto?.editor(profileNode, user, (url) => {
        try { sessionStorage.removeItem(profileCacheKey); } catch (_) {}
        window.LiberterraAgentPhoto.show(avatar, url, user.name);
        window.LiberterraAgentPhoto.show(sidebarAvatar, url, user.name);
      });
      const editorSlot = profileNode.querySelector("[data-pv2-avatar-editor-slot]");
      const photoEditor = profileNode.querySelector(".agent-photo-editor");
      if (editorSlot && photoEditor) editorSlot.append(photoEditor);
      renderAgentApplication();
      window.LiberterraRegistry?.editor(profileNode);
      loaded = true;
    } catch (error) {
      profileNode.innerHTML = hasTelegramSession
        ? '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Нажмите «Повторить». Если ошибка сохранится — отправьте скриншот администратору.</span><button class="profile-primary" type="button" data-profile-retry>Повторить</button></div>'
        : '<div class="profile-empty"><strong>Не удалось загрузить профиль</strong><span>Войдите по email и паролю, затем обновите страницу.</span></div>';
    } finally { loading = false; }
  }

  window.addEventListener("liberterra:agent-role", () => { renderAgentApplication(); loadProfile({ force: true }); });
  window.addEventListener("liberterra:user-registered", () => loadProfile({ force: true }));
  profileNode.addEventListener("click", async (event) => {
    const modal = profileNode.querySelector("#pv2AvatarModal");
    if (event.target.closest("[data-pv2-avatar-edit]")) {
      modal?.classList.add("open");
      modal?.setAttribute("aria-hidden", "false");
      modal?.querySelector("[data-pv2-avatar-close]")?.focus();
      return;
    }
    if (event.target.closest("[data-pv2-avatar-close]") || event.target === modal) {
      modal?.classList.remove("open");
      modal?.setAttribute("aria-hidden", "true");
      return;
    }
    if (event.target.closest("[data-profile-retry]")) {
      loaded = false;
      await loadProfile({ force: true });
      return;
    }
    if (event.target.closest("[data-link-telegram-account]")) {
      window.LiberterraUserAccess?.linkTelegramAccount?.();
      return;
    }
    const button = event.target.closest("[data-profile-logout]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "Выходим…";
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      sessionStorage.removeItem(profileCacheKey);
      location.assign("/");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const modal = profileNode.querySelector("#pv2AvatarModal.open");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    profileNode.querySelector("[data-pv2-avatar-edit]")?.focus();
  });
  loadProfile();
})();

// Use the same language state and translation engine as the public site.
(() => {
  const supported = new Set(['ru', 'ky', 'en', 'zh']);
  function bindProfileLanguage() {
    const picker = document.getElementById('profileLanguage');
    if (!picker || picker.dataset.bound) return;
    picker.dataset.bound = 'true';
    const sync = language => {
      const next = language || window.LiberterraI18n?.language || 'ru';
      if (supported.has(next)) picker.value = next;
    };
    sync();
    picker.addEventListener('change', () => window.LiberterraI18n?.setLanguage(picker.value));
    window.addEventListener('liberterra:languagechange', event => sync(event.detail?.language));
    window.addEventListener('storage', event => {
      if (event.key === 'liberterra_language_v1') sync(event.newValue);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindProfileLanguage, { once: true });
  else bindProfileLanguage();
})();
