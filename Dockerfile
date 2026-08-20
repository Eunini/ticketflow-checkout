FROM node:24-alpine AS frontend
WORKDIR /source
COPY package.json package-lock.json ./
RUN npm ci
COPY app ./app
COPY next-env.d.ts next.config.ts tsconfig.json ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend
WORKDIR /source
COPY Directory.Build.props ./
COPY src/TicketmasterCheckoutAssistant.Core ./src/TicketmasterCheckoutAssistant.Core
COPY src/TicketmasterCheckoutAssistant.Infrastructure ./src/TicketmasterCheckoutAssistant.Infrastructure
COPY src/TicketmasterCheckoutAssistant.Web ./src/TicketmasterCheckoutAssistant.Web
RUN dotnet publish src/TicketmasterCheckoutAssistant.Web/TicketmasterCheckoutAssistant.Web.csproj \
    --configuration Release \
    --output /app/publish \
    --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
COPY --from=backend /app/publish ./
COPY --from=frontend /source/out ./wwwroot
USER $APP_UID
ENTRYPOINT ["dotnet", "TicketmasterCheckoutAssistant.Web.dll"]
