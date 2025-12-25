package com.seasonalseiyuu.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter to protect admin endpoints with API key authentication.
 */
@Component
@Order(1)
public class AdminApiKeyFilter implements Filter {

    private static final String API_KEY_HEADER = "X-API-Key";

    private final String apiKey;

    public AdminApiKeyFilter(@Value("${admin.api-key}") String apiKey) {
        this.apiKey = apiKey;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        // Only protect /api/admin/* endpoints
        if (path.startsWith("/api/admin")) {
            String providedKey = httpRequest.getHeader(API_KEY_HEADER);

            if (providedKey == null || !providedKey.equals(apiKey)) {
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\": \"Unauthorized. Provide valid X-API-Key header.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
