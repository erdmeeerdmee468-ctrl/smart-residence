"use client";

import { useEffect, useState } from "react";

export default function ResidentSettings() {
  const [user, setUser] = useState({ name: "", email: "", phoneNumber: "", unitNumber: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [tab, setTab] = useState<"profile" | "password">("profile");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(({ user: u }) => {
      if (u) setUser({ name: u.name ?? "", email: u.email ?? "", phoneNumber: u.phoneNumber ?? "", unitNumber: u.unitNumber ?? "" });
      setLoading(false);
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setProfileMsg("");
    const res = await fetch("/api/resident/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, phoneNumber: user.phoneNumber }),
    });
    setSaving(false);
    setProfileMsg(res.ok ? "✓ Амжилттай хадгалагдлаа" : "✗ Алдаа гарлаа");
    setTimeout(() => setProfileMsg(""), 3000);
  };

  const changePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      setPassMsg("✗ Нууц үг таарахгүй байна");
      return;
    }
    if (passwords.newPass.length < 6) {
      setPassMsg("✗ Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }
    setChangingPass(true);
    setPassMsg("");
    const res = await fetch("/api/resident/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    });
    const data = await res.json();
    setChangingPass(false);
    if (res.ok) {
      setPassMsg("✓ Нууц үг амжилттай солигдлоо");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } else {
      setPassMsg(`✗ ${data.message ?? "Алдаа гарлаа"}`);
    }
    setTimeout(() => setPassMsg(""), 4000);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-sm placeholder:text-gray-600 transition-all";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Тохиргоо ⚙️</h1>
        <p className="text-gray-500 text-sm">Профайл болон нууц үгээ удирдах.</p>
      </div>

      {/* Avatar */}
      <div className="bg-[#161B22] rounded-[24px] border border-gray-800 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-black flex-shrink-0">
          {user.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{user.name || "Нэргүй"}</p>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {user.unitNumber && (
            <p className="text-blue-400 text-xs mt-1">{user.unitNumber}-р тоот</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-1">
          {([
            { key: "profile", label: "Профайл мэдээлэл" },
            { key: "password", label: "Нууц үг солих" },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="bg-[#161B22] rounded-[24px] border border-gray-800 p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Профайл мэдээлэл</h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Нэр</label>
                <input type="text" placeholder="Нэр" value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })}
                  className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Имэйл хаяг</label>
                <input type="email" value={user.email} disabled
                  className={`${inputCls} opacity-40 cursor-not-allowed`} />
                <p className="text-gray-600 text-xs">Имэйл хаягийг өөрчлөх боломжгүй.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Утасны дугаар</label>
                <input type="tel" placeholder="99xxxxxx" value={user.phoneNumber}
                  onChange={e => setUser({ ...user, phoneNumber: e.target.value })}
                  className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Тоотын дугаар</label>
                <input type="text" value={user.unitNumber} disabled
                  className={`${inputCls} opacity-40 cursor-not-allowed`} />
                <p className="text-gray-600 text-xs">Тоотын дугаарыг админ тохируулна.</p>
              </div>

              {profileMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  profileMsg.startsWith("✓")
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {profileMsg}
                </div>
              )}

              <button onClick={saveProfile} disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {saving ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>Хадгалж байна...</>
                ) : "Хадгалах"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="bg-[#161B22] rounded-[24px] border border-gray-800 p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Нууц үг солих</h3>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Одоогийн нууц үг</label>
            <input type="password" placeholder="••••••••" value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Шинэ нууц үг</label>
            <input type="password" placeholder="••••••••" value={passwords.newPass}
              onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
              className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Нууц үг давтах</label>
            <input type="password" placeholder="••••••••" value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              className={inputCls} />
          </div>

          {passMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              passMsg.startsWith("✓")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {passMsg}
            </div>
          )}

          <button onClick={changePassword} disabled={changingPass || !passwords.current || !passwords.newPass || !passwords.confirm}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
            {changingPass ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Солиж байна...</>
            ) : "Нууц үг солих"}
          </button>
        </div>
      )}
    </div>
  );
}