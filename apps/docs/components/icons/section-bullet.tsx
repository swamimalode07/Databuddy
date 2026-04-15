type SectionBulletProps = {
	color: string;
};

export function SectionBullet({ color }: SectionBulletProps) {
	return (
		<div>
			<svg
				fill="none"
				height="34"
				viewBox="0 0 26 39"
				width="26"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect fill={color} height="13" width="13" />
				<rect fill={color} height="13" width="13" x="13" y="13" />
				<rect fill={color} height="13" width="13" y="26" />
			</svg>
		</div>
	);
}
