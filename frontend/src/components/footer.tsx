export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:px-8">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built with ❤️ by the uKnight team. The source code is available on{" "}
                    <a
                        href="https://github.com/uKnight-Co/uKnight"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4"
                    >
                        GitHub
                    </a>
                    .
                </p>
            </div>
        </footer>
    )
}
