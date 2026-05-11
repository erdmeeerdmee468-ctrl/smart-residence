import Link from "next/link";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
            <ResidenceLogo className="h-full w-full" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">403</h1>
          <h2 className="mb-2 text-xl font-semibold text-gray-700">Эрх хүрэлцэхгүй</h2>
          <p className="mb-6 text-gray-500">Энэ хуудас руу нэвтрэх эрх танд байхгүй байна.</p>
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Нүүр хуудас руу буцах
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Өөр аккаунтаар нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
