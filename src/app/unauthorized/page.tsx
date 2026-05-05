import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Эрх хүрэлцэхгүй
          </h2>
          <p className="text-gray-500 mb-6">
            Энэ хуудас руу нэвтрэх эрх танд байхгүй байна.
          </p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Нүүр хуудас руу буцах
            </Link>
            <Link
              href="/login"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Өөр акаунтаар нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
