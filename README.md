# FINITO - A Mobile Music Streaming Application

FINITO is a mobile music streaming application developed using React Native, designed to provide a seamless audio experience by leveraging a self-hosted Jellyfin media server. This application empowers users to access and stream their personal music library directly from their local network, offering a secure, private, and customizable alternative to commercial streaming services. It represents the practical culmination of a diploma thesis focused on the integration of music streaming functionalities within mobile application development.

## Project Description

FINITO is more than just a music player; it's a personal gateway to your meticulously curated music collection. In an era dominated by subscription-based streaming, FINITO champions the self-hosting philosophy by integrating directly with a user's Jellyfin media server. This allows for direct streaming of a comprehensive music library – encompassing albums, artists, playlists, and individual tracks – all managed on the user's local machine. The application's core design prioritizes a smooth, intuitive user interface coupled with robust integration with the Jellyfin API, ensuring efficient and reliable access to your media. This project serves as a key practical output of a diploma thesis, which delves into the intricacies of integrating and utilizing various music streaming platforms and their APIs within the context of modern mobile application development. It showcases how a mobile client can effectively interact with a powerful, self-hosted media server to deliver a rich user experience.

## Features

FINITO is built with a comprehensive set of features to provide a full-fledged music streaming experience:

* **Deep Jellyfin Integration**: At its heart, FINITO communicates directly with your self-hosted Jellyfin server. This integration allows the application to dynamically fetch your entire music catalog, including metadata, album art, and audio streams, directly from your personal server.
* **Secure User Authentication**: The application implements a secure login mechanism that authenticates users against their existing Jellyfin server credentials. This ensures that only authorized users can access the private music library.
* **Extensive Music Library Browse**: Users can effortlessly navigate their music collection. This includes:
    * **Albums**: Browse through your entire album collection with cover art and album details.
    * **Artists**: Explore artists and their discographies.
    * **Songs**: Access individual tracks, organized by album or within playlists.
* **Comprehensive Playlist Management**: FINITO offers robust features for managing your musical queues:
    * **View Existing Playlists**: Discover and play content from all playlists created within your Jellyfin server.
    * **Modify Playlists**: Dynamically add new songs to existing playlists or remove tracks you no longer wish to be part of a playlist (depending on Jellyfin API capabilities for external playlist modification).
    * **Create New Playlists**: (If supported by the Jellyfin API and implemented) Users can create new playlists directly from the mobile application.
* **Personalized Favorites**: Users can mark their favorite songs, creating a personalized collection for quick and easy access.
* **Powerful Search Functionality**: An efficient search engine allows users to quickly locate specific songs, albums, artists, or playlists within their vast music library, providing real-time results as they type.
* **Intuitive Playback Controls**: The application provides all standard music playback functionalities, including play, pause, skip to next/previous track, and potentially volume control and progress seeking, offering a complete and uninterrupted listening experience.
* **Modern and Responsive User Interface**: Designed with React Native, FINITO boasts a clean, dark-themed interface that is aesthetically pleasing and highly responsive across various mobile devices. The UI/UX is crafted to ensure a smooth, enjoyable, and efficient user journey.

## Technology Stack

The development of FINITO leverages a modern and robust set of technologies, primarily within the JavaScript ecosystem, to ensure a cross-platform and performant application:

* **Frontend: React Native**: The core of the mobile application is built with React Native, enabling a single codebase for both iOS and Android platforms. This choice facilitates rapid development and ensures a native-like user experience.
* **Backend (Media Server): Jellyfin**: Jellyfin serves as the powerful, open-source media server that hosts and manages the user's entire music library. Its robust capabilities handle media serving, transcoding (if necessary), and user authentication.
* **API Communication: Axios**: All HTTP requests to the Jellyfin API are managed using Axios, a promise-based HTTP client for the browser and Node.js. This choice provides a clean and efficient way to interact with the RESTful endpoints of the Jellyfin server.
* **State Management: React Hooks (`useState`, `useEffect`)**: For managing the application's local state and side effects, FINITO primarily utilizes React's built-in hooks. This approach promotes functional components and a more concise, readable codebase.
* **Navigation: React Navigation**: The navigation within the application, including stack, tab, and drawer navigators, is handled by React Navigation, providing a flexible and extensible solution for managing application routes and screen transitions.
* **Audio Playback: `expo-av`**: This Expo module is used for handling audio playback functionalities, providing a unified API for playing, pausing, seeking, and managing audio streams within the React Native environment.
* **Environment Variables: `react-native-dotenv`**: Sensitive information, such as the Jellyfin server URL, is managed using `react-native-dotenv`, allowing for secure configuration and easier deployment across different environments.

## Architecture

FINITO operates on a clear client-server architecture, where the mobile application functions as the client and the Jellyfin server as the backend. This design ensures separation of concerns and scalability:

* **Client (FINITO Mobile App)**:
    * Developed with React Native, it runs on the user's mobile device (iOS/Android).
    * Responsible for rendering the user interface, handling user interactions, and initiating requests to the Jellyfin API.
    * It does not store media files locally; instead, it streams them on demand from the Jellyfin server.
    * Manages user authentication sessions and local application state.
    * Utilizes `expo-av` for audio playback, streaming directly from the server.

* **Server (Jellyfin Media Server)**:
    * A self-hosted instance, typically running on a local network (e.g., a home computer or NAS).
    * Stores the user's entire music library, including audio files and metadata.
    * Exposes a comprehensive RESTful API that the FINITO app interacts with. This API handles:
        * User authentication (username/password verification).
        * Retrieving library content (albums, artists, tracks, playlists).
        * Serving audio streams.
        * Managing user-specific data (e.g., favorites, playback history).
    * Can perform on-the-fly transcoding of audio formats if required by the client device or network conditions.

The communication between the mobile client and the Jellyfin server is facilitated through HTTP requests, primarily using `Axios` in the client. This interaction allows FINITO to dynamically fetch and display media information and stream audio content, providing a responsive and real-time experience of the user's personal music collection.
