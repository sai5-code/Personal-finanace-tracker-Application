import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaList,
  FaChartBar,
  FaReceipt,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: FaHome },
    { path: "/transactions", label: "Transactions", icon: FaList },
    { path: "/budget", label: "Budget", icon: FaChartBar },
    { path: "/receipt-upload", label: "Receipt", icon: FaReceipt },
    { path: "/auto-detect", label: "Auto Detect", icon: FaCog },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        background: "linear-gradient(90deg, #4c8bf5, #3a6fd6)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="container">
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "45px",
                height: "45px",
                backdropFilter: "blur(6px)",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow)",
              }}
            >
              <span
                style={{ color: "white", fontSize: "22px", fontWeight: "800" }}
              >
                ₹
              </span>
            </div>

            <span
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: "20px",
              }}
              className="hide-sm"
            >
              FinanceTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hide-md" style={{ display: "flex", gap: "8px" }}>
            {navItems.map((item) => {
              const Active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: Active ? "#fff" : "rgba(255,255,255,0.75)",
                    background: Active ? "rgba(255,255,255,0.25)" : "transparent",
                    backdropFilter: Active ? "blur(4px)" : "none",
                    boxShadow: Active ? "0 4px 12px rgba(255,255,255,0.25)" : "",
                    textDecoration: "none",
                    transition: "0.2s",
                  }}
                >
                  <item.icon />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User + Logout Desktop */}
          <div className="hide-md" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ color: "white", opacity: 0.9, fontWeight: 500 }}>
              Hi, {user?.name}
            </span>
            <button
              onClick={logout}
              className="btn btn-danger"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
              }}
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="show-md"
            style={{
              padding: "10px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
            }}
          >
            {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            className="show-md"
            style={{
              padding: "16px 0",
              borderTop: "1px solid rgba(255,255,255,0.25)",
              marginTop: "8px",
            }}
          >
            {navItems.map((item) => {
              const Active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    color: Active ? "#fff" : "rgba(255,255,255,0.8)",
                    background: Active ? "rgba(255,255,255,0.25)" : "transparent",
                    marginBottom: "10px",
                    textDecoration: "none",
                    transition: "0.2s",
                  }}
                >
                  <item.icon />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Logout */}
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="btn btn-danger"
              style={{
                width: "100%",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>

      {/* CSS for responsive hide/show */}
      <style>
        {`
          @media (max-width: 768px) {
            .hide-md { display: none !important; }
            .show-md { display: block !important; }
          }
          @media (min-width: 769px) {
            .hide-sm { display: block !important; }
            .show-md { display: none !important; }
          }
        `}
      </style>
    </nav>
  );
};

export default Navbar;
