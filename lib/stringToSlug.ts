export default function stringToSlug(str: string) {
	if (!str || str == "" || typeof str !== "string") return str;

	let string = str.replace(/^\s+|\s+$/g, "").toLowerCase();

	// remove accents, swap ñ for n, etc
	let from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	let to = "aaaaeeeeiiiioooouuuunc------";
	for (let i = 0, l = from.length; i < l; i++) {
		string = string.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
	}

	string = string
		.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
		.replace(/\s+/g, "-") // collapse whitespace and replace by -
		.replace(/-+/g, "-"); // collapse dashes

	return string;
}
