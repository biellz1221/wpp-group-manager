import Head from "next/head";
interface IProps {
	googleAnalyticsID: string;
	googleAdsID: string;
}
export default function GoogleTracker({
	googleAnalyticsID,
	googleAdsID,
}: IProps) {
	const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsID}`;
	const script = `window.dataLayer = window.dataLayer || [];
            function gtag() {
                window.dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', ${googleAnalyticsID});
            gtag('config', ${googleAdsID});`;
	return (
		<Head>
			<script async src={scriptSrc} />
			<script dangerouslySetInnerHTML={{ __html: script }} />
		</Head>
	);
}
