<!-- Converted from documentation/ATMOS_Product_Requirements_Document_v1.pdf (11 pages). -->



# ATMOS



## PRODUCT REQUIREMENTS DOCUMENT



| VERSION | PROJECT | STATUS |

|---|---|---|

| 1.0 | Jun Academy — AI Code Bootcamp | Ready for Development |



> “A clearer view of the weather. Wherever you are.”



****Prepared by:**** Azeez Ayoola

****Platform:**** Responsive Web Application

****Weather data provider:**** Open-Meteo



### DOCUMENT PURPOSE



This document defines the product scope, user experience, functional requirements, technical approach, testing expectations and delivery criteria for Atmos Version 1.0.



---



## 01 — PRODUCT OVERVIEW



### What is Atmos?



Atmos is a simple, responsive weather web application that allows users to check current weather conditions, search for cities around the world and view five-day weather forecasts. The application is designed around a clean, minimal interface that makes weather information easy to understand and accessible across mobile and desktop devices.



### Product at a glance



| ATTRIBUTE | DESCRIPTION |

|---|---|

| Product name | Atmos |

| Product type | Weather web application |

| Primary purpose | Weather information and city search |

| Target platform | Web |

| Default location | Lagos, Nigeria |

| Weather data provider | Open-Meteo |

| Storage | Browser localStorage |

| Development stack | HTML, CSS, Vanilla JavaScript |



---



## 02 — PRODUCT GOALS



| GOAL | DESCRIPTION |

|---|---|

| Easy access | Give users quick access to current weather information. |

| Simple search | Make it easy to find cities and view their weather. |

| Useful forecasts | Present current conditions and five-day forecasts clearly. |

| Convenience | Allow users to revisit their five most recently selected cities. |



---



## 03 — TARGET USERS



Atmos is designed for general users who need convenient access to weather information.



- People checking daily weather conditions.

- Travellers checking weather before visiting another city.

- Users interested in weather conditions across different locations.

- People who prefer a simple weather application without unnecessary features.



---



## 04 — DESIGN DIRECTION



Atmos follows an editorial weather interface with a predominantly light background, dark weather display sections and clear typography.



### Approved design palette



| SWATCH | COLOUR NAME | HEX VALUE | PURPOSE |

|---|---|---|---|

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#233D5B;">\</span> | Deep Blue | `#233D5B` | Brand colour |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#579BFF;">\</span> | Sky Blue | `#579BFF` | Primary accent |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#FFC857;">\</span> | Sunlight | `#FFC857` | Weather highlights |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#F5F7FA;border:1px solid #DCE4ED;">\</span> | Primary Background | `#F5F7FA` | Main page background |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#FFFFFF;border:1px solid #DCE4ED;">\</span> | Surface | `#FFFFFF` | Cards and surfaces |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#17263B;">\</span> | Dark Background | `#17263B` | Current weather card |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#17212F;">\</span> | Primary Text | `#17212F` | Main text |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#78879A;">\</span> | Secondary Text | `#78879A` | Supporting text |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#A7B4C7;">\</span> | Muted Text | `#A7B4C7` | Placeholder and subtle text |

| \<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:#DCE4ED;">\</span> | Border | `#DCE4ED` | Dividers and outlines |



### Design principles



- Keep the interface clean and easy to navigate.

- Use consistent spacing, typography and components.

- Make temperature and weather conditions visually prominent.

- Avoid unnecessary decoration and features.

- Ensure the design adapts to mobile and desktop screens.



---



## 05 — CORE FEATURES



| FEATURE | FUNCTIONALITY | PRIORITY |

|---|---|---|

| Current Weather | Display current temperature and weather condition. | High |

| Weather Metrics | Display feels-like temperature, humidity, wind and visibility. | High |

| City Search | Search for cities by name. | High |

| Search Results | Display matching cities and their countries. | High |

| City Weather Details | Open the weather information for a selected city. | High |

| Five-Day Forecast | Display daily conditions, highs and lows. | High |

| Recent Searches | Store the five most recently selected cities. | High |



****Version 1.0 exclusions:**** User accounts, registration, maps, push notifications, social features and backend services.



---



## 06 — APPLICATION STRUCTURE



Atmos consists of four designed screen states.



| SCREEN | MAIN PURPOSE |

|---|---|

| 01. Weather Dashboard | Display default city weather. |

| 02. Search — Empty State | Allow users to begin a city search and view recent searches. |

| 03. Search — Results State | Display matching cities. |

| 04. City Weather Details | Display weather for the selected city. |



### User journey diagram



```text

WEATHER DASHBOARD · Tap search

              ↓

SEARCH — EMPTY STATE · Enter city name

              ↓

SEARCH — RESULTS STATE · Select a city

              ↓

CITY WEATHER DETAILS · Tap back to results

```



### Screen requirements



#### 6.1 Weather Dashboard



- Display Lagos, Nigeria as the initial default location.

- Display current temperature and weather condition.

- Show feels-like temperature, humidity, wind speed and visibility.

- Display the five-day forecast.

- Provide access to the city search screen.



#### 6.2 Search — Empty State



- Display a search input.

- Display recent searches when available.

- Allow users to enter a city name.

- Display an appropriate message when no recent searches exist.



#### 6.3 Search — Results State



- Display cities matching the search query.

- Show city names and country names.

- Allow users to select a city.

- Display a helpful message when no matching cities are found.



#### 6.4 City Weather Details



- Display the selected city's name and country.

- Display current weather conditions and metrics.

- Display the five-day forecast.

- Include a back arrow to return to search results.



---



## 07 — WEATHER DATA & API INTEGRATION



Atmos will use the Open-Meteo API to retrieve geographical and weather information.



### API services



| SERVICE | PURPOSE |

|---|---|

| Geocoding API | Search for cities and retrieve coordinates. |

| Forecast API | Retrieve current weather and daily forecast data. |



### Geocoding endpoint



```text

https\://geocoding-api.open-meteo.com/v1/search

```



### Forecast endpoint



```text

https\://api.open-meteo.com/v1/forecast

```



### Data requirements



| DATA | DESCRIPTION | UNIT |

|---|---|---|

| Temperature | Current temperature | °C |

| Weather condition | Readable weather description | Text |

| Feels-like | Apparent temperature | °C |

| Humidity | Relative humidity | % |

| Wind speed | Current wind speed | km/h |

| Visibility | Current visibility | km |

| Daily high | Maximum daily temperature | °C |

| Daily low | Minimum daily temperature | °C |



The application should request the appropriate weather variables from the API and convert returned weather codes into readable descriptions and matching icons.



****Forecast period:**** Five days, including the current day where available.



****API documentation:**** https\://open-meteo.com/en/docs | https\://open-meteo.com/en/docs/geocoding-api



---



## 08 — APPLICATION LOGIC



### City search workflow



1\. User enters a city name

2\. Validate search input

3\. Send request to Geocoding API

4\. Receive matching locations

5\. Display city search results

6\. User selects a city

7\. Retrieve its coordinates

8\. Request weather information

9\. Display City Weather Details



### Weather retrieval workflow



1\. Selected city coordinates

2\. Open-Meteo Forecast API

3\. Retrieve current conditions

4\. Retrieve daily forecast

5\. Process weather codes

6\. Display weather information



### Recent searches



- Save the five most recently selected cities in localStorage.

- Store the city name, country and geographical coordinates.

- Display recent searches on the empty search screen.

- Selecting a recent city should open its weather details.

- Move recently selected cities to the top.

- Avoid duplicate entries for the same location.



---



## 09 — LOADING, EMPTY & ERROR STATES



The application must provide feedback when data is unavailable or requests are unsuccessful.



| STATE | EXPECTED BEHAVIOUR |

|---|---|

| Loading | Display a loading indicator while data is retrieved. |

| No Search Results | Inform the user that no matching cities were found. |

| Network Error | Display a friendly connection error message. |

| Weather Error | Inform the user that weather data could not be loaded. |

| Empty Recent Searches | Display a helpful empty-state message. |

| Invalid Input | Prevent empty searches and handle invalid entries. |



The application must handle failed requests gracefully without crashing.



---



## 10 — TECHNICAL REQUIREMENTS



### Technology stack



| TECHNOLOGY | RESPONSIBILITY |

|---|---|

| HTML5 | Application structure |

| CSS3 | Styling and responsive layouts |

| Vanilla JavaScript | Application logic and API integration |

| Open-Meteo | Weather and geocoding data |

| localStorage | Recent search persistence |

| GitHub | Source code management |

| Vercel / GitHub Pages | Deployment |



### Development restrictions



- No frontend frameworks.

- No backend development.

- No paid weather APIs.

- No unnecessary dependencies.

- Keep HTML, CSS and JavaScript organised into separate files.

- Use reusable functions and maintain readable code.



### Suggested project structure



```text

ATMOS/

├── index.html

├── css/

│   └── style.css

├── js/

│   ├── app.js

│   ├── weather.js

│   ├── search.js

│   └── storage.js

├── assets/

│   └── icons/

└── README.md

```



---



## 11 — RESPONSIVE DESIGN & ACCESSIBILITY



Atmos must work across different screen sizes.



| DEVICE | TARGET |

|---|---|

| Mobile | Approximately 375px and above |

| Tablet | Responsive intermediate layouts |

| Desktop | Full-width responsive layout |



### Accessibility requirements



- Maintain readable text sizes.

- Use sufficient colour contrast.

- Provide accessible labels for inputs and buttons.

- Ensure interactive elements support keyboard navigation.

- Use meaningful HTML elements.

- Avoid horizontal overflow on small screens.



---



## 12 — DEVELOPMENT ROADMAP



Development will follow a feature-by-feature approach.



| PHASE | TASK | EXPECTED RESULT |

|---|---|---|

| 01 | Project setup | Working HTML, CSS and JS structure |

| 02 | Interface development | Figma-inspired application layout |

| 03 | City search | Functional geocoding search |

| 04 | Search results | Matching locations displayed |

| 05 | Weather integration | Current weather retrieved |

| 06 | Forecast | Five-day forecast displayed |

| 07 | Recent searches | localStorage functionality |

| 08 | Error handling | Loading, empty and error states |

| 09 | Testing | Functional and responsive checks |

| 10 | Deployment | Live application |



### Development workflow



```text

PLAN

  ↓

BUILD ONE FEATURE

  ↓

TEST FEATURE

  ↓

FIX ISSUES

  ↓

COMMIT CHANGES

  ↓

MOVE TO NEXT FEATURE

```



Each feature must be tested before moving to the next. Code should be explained during development so the developer understands how it works.



---



## 13 — TESTING REQUIREMENTS



Before deployment, verify the following:



| TEST | EXPECTED RESULT |

|---|---|

| Dashboard | Loads successfully with default weather. |

| City search | Accepts and processes city names. |

| Search results | Displays correct city and country information. |

| City selection | Opens the selected city's weather details. |

| Back navigation | Returns to search results. |

| Current weather | Displays accurate API data. |

| Five-day forecast | Displays daily conditions and temperatures. |

| Recent searches | Saves and restores the last five cities. |

| Error handling | Displays helpful feedback when requests fail. |

| Responsiveness | Works on mobile and desktop. |

| Browser console | No major application errors. |



---



## 14 — DEPLOYMENT & FINAL DELIVERABLES



The completed project must include:



- A functional Atmos weather web application.

- Source code hosted on GitHub.

- A live deployment using Vercel or GitHub Pages.

- A README containing project information, features and setup instructions.

- A short project case study or demonstration.



---



## 15 — SUCCESS CRITERIA



Atmos will be considered complete when users can:



- View current weather conditions.

- Search for cities around the world.

- Select a city and view its weather.

- View a five-day forecast.

- Return to search results.

- Revisit their five most recently selected cities.



The application must be responsive, functional, visually consistent with the approved Figma design and successfully deployed.



---



## PROJECT STATUS



### ATMOS — VERSION 1.0



| PROJECT STAGE | STATUS |

|---|---|

| Product definition | Complete |

| Figma foundations | Complete |

| Components | Complete |

| Application screens | Complete |

| Prototype | Complete |

| PRD | Complete |

| Development | Next |

| Testing & deployment | Pending |



---



****END OF DOCUMENT****



*\*Atmos — A clearer view of the weather.\**
