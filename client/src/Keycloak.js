import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
 url: "http://localhost:8080",
 realm: "deviantart-realm",
 clientId: "deviantart-frontend",
});

export default keycloak;