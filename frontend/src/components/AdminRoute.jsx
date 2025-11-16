// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../services/api";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    apiGet("/profile/me")
      .then((me) => {
        if (!mounted) return;

        if (me?.is_admin) {
          setAllowed(true);
        } else {
          navigate("/"); // redirect non-admins
        }
      })
      .catch(() => {
        if (mounted) navigate("/");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Prevent flashing of the admin UI
  if (loading) {
    return (
      <div className="p-6 text-gray-600 text-sm">
        Comprobando permisos…
      </div>
    );
  }

  return allowed ? children : null;
}
