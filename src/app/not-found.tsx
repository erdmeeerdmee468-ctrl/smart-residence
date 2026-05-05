import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h2 className="text-6xl font-bold text-blue-600 mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-8">Уучлаарай, таны хайсан хуудас олдсонгүй.</p>
      <Link 
        href="/" 
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
      >
        Нүүр хуудас руу буцах
      </Link>
    </div>
  );
}
