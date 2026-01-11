"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Cpu,
  ShieldAlert,
  MapPin,
  Crosshair,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [prefs, setPrefs] = useState<Record<string, any>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"mission" | "system" | "profile">(
    "mission"
  );
  const { logout, user } = useAuthStore();

  const fetchPrefs = async () => {
    try {
      const res = await api.get("/user/prefs");
      setPrefs(res.data.data || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) fetchPrefs();
  }, [isOpen]);

  const handleSave = async () => {
    if (!newKey.trim()) return;
    try {
      setLoading(true);
      await api.post("/user/prefs", { key: newKey, value: newValue });
      setNewKey("");
      setNewValue("");
      await fetchPrefs();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMission = async (key: string, value: string) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    // Debounce save logic could go here, but for now simple direct save
    try {
      await api.post("/user/prefs", { key, value });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await api.delete(`/user/prefs/${key}`);
      await fetchPrefs();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to get value
  const getVal = (k: string) => prefs[k] || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-slate-950 border border-blue-500/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[600px]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-blue-500/10 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Cpu size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide font-mono">
                    MISSION_CONFIG_V1
                  </h2>
                  <div className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em]">
                    System Configuration Interface
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-gray-400"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-48 bg-slate-900/30 border-r border-blue-500/10 p-3 space-y-1">
                {[
                  {
                    id: "mission",
                    label: "Mission Parameters",
                    icon: Crosshair,
                  },
                  { id: "system", label: "System Preferences", icon: Settings },
                  { id: "profile", label: "Crew Profile", icon: User },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-600/10 text-cyan-300 border border-blue-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent">
                <AnimatePresence mode="wait">
                  {activeTab === "mission" && (
                    <motion.div
                      key="mission"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-4 bg-cyan-500" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Mission Parameters
                        </h3>
                      </div>

                      {/* Main Context Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 mb-1.5 block">
                            Vessel Designation
                          </label>
                          <Input
                            value={getVal("mission_vessel")}
                            onChange={(e) =>
                              handleUpdateMission(
                                "mission_vessel",
                                e.target.value
                              )
                            }
                            placeholder="e.g. USSC Avalon"
                            className="bg-slate-900/50 border-blue-500/20 focus:border-cyan-500/50 text-cyan-100 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 mb-1.5 block">
                            Current Location
                          </label>
                          <div className="relative">
                            <MapPin
                              size={12}
                              className="absolute left-3 top-3 text-cyan-500/50"
                            />
                            <Input
                              value={getVal("mission_location")}
                              onChange={(e) =>
                                handleUpdateMission(
                                  "mission_location",
                                  e.target.value
                                )
                              }
                              placeholder="Sector 7G"
                              className="pl-9 bg-slate-900/50 border-blue-500/20 focus:border-cyan-500/50 text-cyan-100 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 mb-1.5 block">
                            Day Cycle
                          </label>
                          <Input
                            type="number"
                            value={getVal("mission_day")}
                            onChange={(e) =>
                              handleUpdateMission("mission_day", e.target.value)
                            }
                            placeholder="142"
                            className="bg-slate-900/50 border-blue-500/20 focus:border-cyan-500/50 text-cyan-100 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-cyan-500/60 mb-1.5 block">
                          Mission Objective
                        </label>
                        <textarea
                          value={getVal("mission_objective")}
                          onChange={(e) =>
                            handleUpdateMission(
                              "mission_objective",
                              e.target.value
                            )
                          }
                          className="w-full h-24 bg-slate-900/50 border border-blue-500/20 rounded-xl p-3 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-mono"
                          placeholder="Define primary mission parameters..."
                        />
                      </div>

                      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert size={14} className="text-yellow-400" />
                          <label className="text-[10px] uppercase tracking-widest text-yellow-500/60 block">
                            Critical Alert Status
                          </label>
                        </div>
                        <Input
                          value={getVal("mission_alert")}
                          onChange={(e) =>
                            handleUpdateMission("mission_alert", e.target.value)
                          }
                          placeholder="e.g. Oxygen levels low..."
                          className="bg-slate-900/50 border-yellow-500/20 focus:border-yellow-500/50 text-yellow-100 font-mono"
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "system" && (
                    <motion.div
                      key="system"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-4 bg-blue-500" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Variable Registry
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {Object.keys(prefs).filter(
                          (k) =>
                            !k.startsWith("mission_") && k !== "mission_context"
                        ).length === 0 && (
                          <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-xs text-gray-500 italic">
                              No custom system variables defined.
                            </p>
                          </div>
                        )}

                        {Object.entries(prefs)
                          .filter(
                            ([k]) =>
                              !k.startsWith("mission_") &&
                              k !== "mission_context"
                          )
                          .map(([k, v]) => (
                            <div
                              key={k}
                              className="group flex items-center justify-between text-sm bg-slate-900/40 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                            >
                              <div className="font-mono text-xs">
                                <span className="text-blue-300">{k}</span>
                                <span className="mx-2 text-gray-600">::</span>
                                <span className="text-gray-400">
                                  {String(v)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDelete(k)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                          Add System Variable
                        </h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="VAR_NAME"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="bg-slate-900/50 border-white/10 font-mono text-xs"
                          />
                          <Input
                            placeholder="VALUE"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="bg-slate-900/50 border-white/10 font-mono text-xs"
                          />
                          <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500"
                          >
                            <Save size={16} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-500/20">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {user?.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {user?.userName}
                          </div>
                          <div className="text-xs text-blue-300/60 font-mono">
                            ID: {user?.id}
                          </div>
                        </div>
                      </div>

                      <div className="pt-8">
                        <Button
                          onClick={() => {
                            logout();
                            onClose();
                          }}
                          variant="destructive"
                          className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        >
                          End Session
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
