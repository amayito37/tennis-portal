import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6">
      <nav className="flex gap-6 text-gray-600 font-medium">
        <a href="/">Home</a>
        <a href="/rankings">Rankings</a>
        <a href="/fixtures">Fixtures</a>
      </nav>
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        <User size={20} className="text-blue-600" />
        John Doe
      </div>
    </header>
  );
}
