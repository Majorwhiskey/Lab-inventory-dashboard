import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import WelcomeGate from "./components/WelcomeGate";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      {!unlocked && <WelcomeGate onUnlock={() => setUnlocked(true)} />}
      <div className={!unlocked ? "blur-[5px] pointer-events-none select-none" : ""}>
        <Routes>
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="*" element={<Navigate to="/inventory" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </div>
    </>
  );
}
