# Qibla Precision Benchmark: Spherical vs Ellipsoidal

| Location | Method A (Spherical) | Method B (Vincenty) | Method C (Karney) | Error (A vs C) | Displacement at Makkah (m) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Jeddah (< 100km) | 101.0551 | 101.0551 | 101.0551 | 0.0000° | 0.00m |
| Makkah Suburb (< 10km) | 116.3380 | 116.3380 | 116.3380 | 0.0000° | 0.00m |
| Tromsø, Norway | 154.2409 | 154.2409 | 154.2409 | 0.0000° | 0.00m |
| Reykjavik, Iceland | 106.0275 | 106.0275 | 106.0275 | 0.0000° | 0.00m |
| Anchorage, Alaska | 350.8831 | 350.8993 | 350.8993 | 0.0162° | 3055.39m |
| Pontianak, Indonesia | 292.6362 | 292.6362 | 292.6362 | 0.0000° | 0.00m |
| Quito, Ecuador | 66.0648 | 66.0648 | 66.0648 | 0.0000° | 0.00m |
| Tematangi, Polynesia (Antipodal) | 237.7421 | Failed (Antipode) | 210.1197 | 27.6223° | 9623154.55m |
| Exact Antipode | 90.0000 | Failed | N/A | N/A | N/A |
| Karachi, Pakistan | 267.7852 | 267.7852 | 267.7852 | 0.0000° | 0.00m |
| London, UK | 118.8684 | 118.8684 | 118.8684 | 0.0000° | 0.00m |
| New York, USA | 58.3960 | 58.3960 | 58.3960 | 0.0000° | 0.00m |
| Tokyo, Japan | 293.0720 | 293.0720 | 293.0720 | 0.0000° | 0.00m |
| Sydney, Australia | 277.3188 | 277.3188 | 277.3188 | 0.0000° | 0.00m |
| Cape Town, SA | 23.4673 | 23.4673 | 23.4673 | 0.0000° | 0.00m |

### Global Statistics
- **Max Angular Error:** 27.6223°
- **Mean Absolute Error (MAE):** 1.9742°
- **Root Mean Squared Error (RMSE):** 7.3824°
