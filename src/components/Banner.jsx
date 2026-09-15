import Image from "next/image";
import Link from "next/link";
import styles from "./Banner.module.scss";

const DEFAULT_IMAGE_SRC = "/images/banner.webp";
const DEFAULT_ALT = "프론트엔드 스킬업 이벤트";

function getDestinationType(href) {
  if (typeof href !== "string") {
    return "none";
  }

  const destination = href.trim();

  if (destination.startsWith("/") && !destination.startsWith("//")) {
    return "internal";
  }

  try {
    const url = new URL(destination);
    return url.protocol === "http:" || url.protocol === "https:" ? "external" : "none";
  } catch {
    return "none";
  }
}

export default function Banner({ imageSrc = DEFAULT_IMAGE_SRC, alt = DEFAULT_ALT, href = "" }) {
  if (typeof imageSrc !== "string" || imageSrc.trim() === "") {
    return null;
  }

  const normalizedImageSrc = imageSrc.trim();
  const destination = typeof href === "string" ? href.trim() : "";
  const destinationType = getDestinationType(destination);
  const image = (
    <Image
      className={styles["banner-image"]}
      src={normalizedImageSrc}
      alt={alt}
      width={1322}
      height={358}
      sizes="100vw"
    />
  );

  if (destinationType === "internal") {
    return (
      <div className={styles["banner"]}>
        <Link className={styles["banner-link"]} href={destination}>
          {image}
        </Link>
      </div>
    );
  }

  if (destinationType === "external") {
    return (
      <div className={styles["banner"]}>
        <a
          className={styles["banner-link"]}
          href={destination}
          target="_blank"
          rel="noopener noreferrer"
        >
          {image}
        </a>
      </div>
    );
  }

  return <div className={styles["banner"]}>{image}</div>;
}
