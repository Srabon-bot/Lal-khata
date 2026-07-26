import { useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CoverSplash } from "./components/CoverSplash";
import { WelcomePage, ENTERED_KEY } from "./pages/WelcomePage";
import { KhataPage } from "./pages/KhataPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { SummaryPage } from "./pages/SummaryPage";

function hasEntered(): boolean {
  try {
    return !!localStorage.getItem(ENTERED_KEY);
  } catch {
    return true;
  }
}

/** Gates the ledger app behind the welcome page on a visitor's first-ever visit. */
function RequireEntered({ children }: { children: ReactNode }) {
  if (!hasEntered()) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function AppShell() {
  const [coverDone, setCoverDone] = useState(false);
  return (
    <>
      <CoverSplash onDone={() => setCoverDone(true)} />
      <div style={{ visibility: coverDone ? "visible" : "hidden" }}>
        <Layout />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route
          element={
            <RequireEntered>
              <AppShell />
            </RequireEntered>
          }
        >
          <Route path="/" element={<KhataPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
