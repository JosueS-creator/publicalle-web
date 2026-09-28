import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { CalendarDays, Building2, CircleUser, FolderKanban, Inbox, Map as MapIcon, Truck, Users, LayoutGrid } from "lucide-react";
import { AuthProvider, esStaff, useAuth } from "./auth";
import { Shell, type NavItem } from "./Shell";
import { Loading } from "./ui";
import Login from "./Login";
import Cuenta from "./Cuenta";
import Solicitudes from "./admin/Solicitudes";
import SolicitudDetalle from "./admin/SolicitudDetalle";
import Clientes from "./admin/Clientes";
import ClienteDetalle from "./admin/ClienteDetalle";
import Campanias from "./admin/Campanias";
import CampaniaDetalle from "./admin/CampaniaDetalle";
import Jornadas from "./admin/Jornadas";
import JornadaDetalle from "./admin/JornadaDetalle";
import Unidades from "./admin/Unidades";
import Zonas from "./admin/Zonas";
import Usuarios from "./admin/Usuarios";
import PortalInicio from "./portal/PortalInicio";
import PortalCampania from "./portal/PortalCampania";
import OperadorInicio from "./operador/OperadorInicio";
import OperadorJornada from "./operador/OperadorJornada";

const adminNav: NavItem[] = [
  { to: "/admin", label: "Solicitudes", icon: <Inbox />, end: true },
  { to: "/admin/clientes", label: "Clientes", icon: <Building2 /> },
  { to: "/admin/campanias", label: "Campañas", icon: <FolderKanban /> },
  { to: "/admin/jornadas", label: "Jornadas", icon: <CalendarDays /> },
  { to: "/admin/zonas", label: "Zonas", icon: <MapIcon /> },
  { to: "/admin/unidades", label: "Unidades", icon: <Truck /> },
  { to: "/admin/usuarios", label: "Usuarios", icon: <Users /> },
  { to: "/admin/cuenta", label: "Mi cuenta", icon: <CircleUser /> },
];
const portalNav: NavItem[] = [
  { to: "/portal", label: "Mis campañas", icon: <LayoutGrid />, end: true },
  { to: "/portal/cuenta", label: "Mi cuenta", icon: <CircleUser /> },
];
const operadorNav: NavItem[] = [
  { to: "/operador", label: "Mis jornadas", icon: <CalendarDays />, end: true },
  { to: "/operador/cuenta", label: "Mi cuenta", icon: <CircleUser /> },
];

function Guard({ allow, children }: { allow: "staff" | "cliente" | "operador"; children: ReactNode }) {
  const { loading, session, perfil } = useAuth();
  if (loading) return <div className="grid min-h-dvh place-items-center"><Loading /></div>;
  if (!session) return <Navigate to="/entrar" replace />;
  const ok = allow === "staff" ? esStaff(perfil) : perfil?.activo && perfil.rol === allow;
  if (!ok) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
}

/** Admin y portal (se carga aparte de la web pública). */
export default function PlatformApp() {
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/admin" element={<Guard allow="staff"><Shell nav={adminNav} area="Panel de administración" /></Guard>}>
            <Route index element={<Solicitudes />} />
            <Route path="solicitudes/:id" element={<SolicitudDetalle />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<ClienteDetalle />} />
            <Route path="campanias" element={<Campanias />} />
            <Route path="campanias/:id" element={<CampaniaDetalle />} />
            <Route path="jornadas" element={<Jornadas />} />
            <Route path="jornadas/:id" element={<JornadaDetalle />} />
            <Route path="zonas" element={<Zonas />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="cuenta" element={<Cuenta />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="/portal" element={<Guard allow="cliente"><Shell nav={portalNav} area="Portal de clientes" /></Guard>}>
            <Route index element={<PortalInicio />} />
            <Route path="campanias/:id" element={<PortalCampania />} />
            <Route path="cuenta" element={<Cuenta />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
          <Route path="/operador" element={<Guard allow="operador"><Shell nav={operadorNav} area="Operador" /></Guard>}>
            <Route index element={<OperadorInicio />} />
            <Route path="jornadas/:id" element={<OperadorJornada />} />
            <Route path="cuenta" element={<Cuenta />} />
            <Route path="*" element={<Navigate to="/operador" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/entrar" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
