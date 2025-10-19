import Header from '../components/Header';

export default function Fixtures() {
  return (
    <div className="flex flex-col flex-1 p-10 overflow-auto">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Fixtures</h1>
      <p>Upcoming fixtures will appear here.</p>
    </div>
  );
}
