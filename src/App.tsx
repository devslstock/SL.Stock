import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import AllLoads from './pages/AllLoads'
import CreateLoad from './pages/CreateLoad'
import Conference from './pages/Conference'
import DeliveryProof from './pages/DeliveryProof'
import Products from './pages/Products'
import AccessControl from './pages/AccessControl'

// Placeholder for Inventory
function Inventory() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-2xl font-bold gradient-text mb-2">Módulo de Inventário</h2>
      <p className="text-muted-foreground max-w-md">
        Este módulo gerencia contagens físicas, estoque teórico e estrutura do armazém. Em desenvolvimento.
      </p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cargas" element={<AllLoads />} />
        <Route path="/nova-carga" element={<CreateLoad />} />
        <Route path="/editar-carga/:id" element={<CreateLoad />} />
        <Route path="/conferencia/:id" element={<Conference />} />
        <Route path="/comprovante/:id" element={<DeliveryProof />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/acesso" element={<AccessControl />} />
      </Route>
    </Routes>
  )
}

export default App
