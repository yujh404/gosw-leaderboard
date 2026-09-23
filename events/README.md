# 체육대회 종목

종목 안내와 대표 이미지를 종목별 폴더에 함께 보관한다.

| 순서 | 종목 | 폴더 |
| --- | --- | --- |
| 1 | 애드벌룬 경기 (몸풀기 경기) | [ad-balloon](ad-balloon/) |
| 2 | 파도타기 릴레이 (몸풀기 경기) | [wave-relay](wave-relay/) |
| 3 | 에어봉 릴레이 | [air-pole-relay](air-pole-relay/) |
| 4 | 서바이벌 깃발 잡기 | [flag-survival](flag-survival/) |
| 5 | 6인 7각 | [six-seven-legged](six-seven-legged/) |
| 6 | 줄다리기 | [tug-of-war](tug-of-war/) |
| 7 | 축구 과대항전 결승 | [soccer-final](soccer-final/) |
| 8 | 왕 피구 과대항전 결승 | [king-dodgeball-final](king-dodgeball-final/) |
| 9 | 계주 (반별 5명) | [relay](relay/) |
| 10 | 응원 | [cheering](cheering/) |

각 폴더는 다음 파일로 구성한다.

- `event.json`: 종목 이름, 소개, 규칙, 이미지 경로, 이미지 생성 정보를 기록한다.
- `image.webp`: 관리자 화면에 업로드할 종목 대표 이미지다.
- `prompt.txt`: 이미지 생성에 사용한 원문 프롬프트다.

새 종목은 영문 소문자와 하이픈으로 폴더를 만들고 같은 구성을 추가한다. 관리자 화면에 안내 내용을 등록하고 이미지를 업로드한다. 사진은 JPG·PNG·WebP 형식과 2MB 이하의 크기를 지원한다.

1~9번 종목의 이미지는 `image_gen`으로 생성한 가상의 고등학생 체육대회 장면이다. 10번 응원 이미지와 안내는 기존 자료를 유지한다. 이 폴더의 내용은 관리자 화면에 자동 등록되지 않으므로 운영 교사가 종목을 등록하고 이미지를 업로드한다.
