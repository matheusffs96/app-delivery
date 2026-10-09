export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="mx-auto w-full max-w-2xl px-4 py-6 lg:max-w-none lg:px-0 lg:py-0">
            {children}
        </main>
    );
}
