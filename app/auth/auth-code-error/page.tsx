export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          There was an error confirming your email address. This could happen
          if:
        </p>
        <ul className="text-left text-gray-600 mb-8 max-w-md space-y-2">
          <li>• The confirmation link has expired</li>
          <li>• The link has already been used</li>
          <li>• There was a network error</li>
        </ul>
        <div className="space-y-4">
          <a
            href="/login"
            className="inline-block px-6 py-3 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Signing In Again
          </a>
          <p className="text-sm text-gray-500">
            If you continue to have issues, try creating a new account.
          </p>
        </div>
      </main>
    </div>
  );
}
