import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import BarcodeScanner from "./pages/BarcodeScanner";
import Orders from "./pages/Orders";
import Contacts from "./pages/Contacts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PurchaseOrders from "./pages/PurchaseOrders";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Integrations from "./pages/Integrations";
import Automation from "./pages/Automation";
import Customization from "./pages/Customization";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import { App as cApp } from "@capacitor/app";

const queryClient = new QueryClient();
cApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    // Navigate to the previous page
    window.history.back();
  } else {
    // Optionally show a confirmation dialog before exiting
    if (confirm('Are you sure you want to exit the app?')) {
      cApp.exitApp();
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/products" element={
            <Layout>
              <Products />
            </Layout>
          } />
          <Route path="/scanner" element={
            <Layout>
              <BarcodeScanner />
            </Layout>
          } />
          <Route path="/orders" element={
            <Layout>
              <Orders />
            </Layout>
          } />
          <Route path="/purchase-orders" element={
            <Layout>
              <PurchaseOrders />
            </Layout>
          } />
          <Route path="/bills" element={
            <Layout>
              <Bills />
            </Layout>
          } />
          <Route path="/contacts" element={
            <Layout>
              <Contacts />
            </Layout>
          } />
          <Route path="/reports" element={
            <Layout>
              <Reports />
            </Layout>
          } />
          <Route path="/analytics" element={
            <Layout>
              <Analytics />
            </Layout>
          } />
          <Route path="/integrations" element={
            <Layout>
              <Integrations />
            </Layout>
          } />
          <Route path="/automation" element={
            <Layout>
              <Automation />
            </Layout>
          } />
          <Route path="/customization" element={
            <Layout>
              <Customization />
            </Layout>
          } />
          <Route path="/settings" element={
            <Layout>
              <Settings />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;