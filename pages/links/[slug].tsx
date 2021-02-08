import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/core";
import axios from "axios";
import Loading from "../../components/Loading";
import FacebookTracker from "../../components/trackers/FacebookTracker";
import GoogleTracker from "../../components/trackers/GoogleTracker";

export default function RandomLink() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const [tracker, setTracker] = useState({
		googleAnalytics: "",
		googleAds: "",
		facebook: "",
	});
	const { slug } = router.query;
	useEffect(() => {
		getLinkAndRedirect();
		async function getLinkAndRedirect() {
			try {
				setLoading(true);
				setMessage("");
				if (slug) {
					const { data } = await axios.get(`/api/links/${slug}`);
					let timeToRedirect = 0;
					if (data.tracker) {
						const { googleAnalytics, googleAds, facebook } = data.tracker || "";
						setTracker({ googleAnalytics, googleAds, facebook });
						timeToRedirect = 500;
					}
					if (data.link) {
						const link = data.link;
						setTimeout(() => {
							router.push(link);
						}, timeToRedirect);
					}
					if (data.message) {
						setMessage(data.message);
						setLoading(false);
					}
				}
			} catch (error) {
				if (error.response.data.message) {
					setMessage(error.response.data.message);
				} else {
					setMessage("Erro na solicitação do link");
				}
				setLoading(false);
			}
		}
	}, [slug]);
	if (loading)
		return (
			<>
				{tracker.facebook !== "" && (
					<FacebookTracker facebookPixelID={tracker.facebook} />
				)}
				{tracker.googleAnalytics !== "" && (
					<GoogleTracker
						googleAnalyticsID={tracker.googleAnalytics}
						googleAdsID={tracker.googleAds}
					/>
				)}
				<Loading />
			</>
		);
	return (
		<Flex
			height="100vh"
			width="100vw"
			justifyContent="center"
			alignItems="center">
			<Text fontSize="lg">{message}</Text>
		</Flex>
	);
}
