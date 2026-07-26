import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CoverSplash } from "./components/CoverSplash";
import { KhataPage } from "./pages/KhataPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { SummaryPage } from "./pages/SummaryPage";

function App() {
  const [coverDone, setCoverDone] = useState(false);

  return (
    <BrowserRouter>
      <CoverSplash onDone={() => setCoverDone(true)} />
      <div style={{ visibility: coverDone ? "visible" : "hidden" }}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<KhataPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
