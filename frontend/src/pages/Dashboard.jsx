import Header from '../components/Header';

export default function Dashboard() {
  return (
    <div className="flex flex-col flex-1 p-10 overflow-auto">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to the Tennis Ranking Portal 👋</p>
    </div>
  );
}
