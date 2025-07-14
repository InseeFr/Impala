/* eslint-disable @next/next/no-sync-scripts */
import "./globals.css";

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <head>
                <meta charSet="utf-8" />
                <link rel="icon" href="/insee.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#000000" />
                <link href="/yasgui.css" rel="stylesheet" type="text/css" />
                <script src="/yasgui.min.js"></script>

                <meta name="description" content="Web site created using create-react-app" />
                <link rel="apple-touch-icon" href="/logo192.png" />

                <link rel="manifest" href="/manifest.json" />
                <title>Espace RDF de l&rsquo;Insee</title>
            </head>

            <body>
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <h1>
                    <img src="/insee.png" alt="INSEE" />
                </h1>

                {children}
            </body>
        </html>
    );
}
