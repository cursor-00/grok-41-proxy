#define _GNU_SOURCE
#include <dlfcn.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>

// Store original connect function
static int (*original_connect)(int, const struct sockaddr *, socklen_t);

// Our redirected Anthropic IPs
static const char *blocked_ips[] = {
    "160.79.104.10",  // api.anthropic.com
    "20.197.80.108",  // code-tunnel
    "3.22.121.133",   // opencode
    "64.239.123.193", // opencode
    "34.36.57.103",   // Claude GCP
    "140.82.113.22",  // GitHub
    NULL
};

int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen) {
    // Load original on first call
    if (!original_connect) {
        original_connect = dlsym(RTLD_NEXT, "connect");
    }
    
    // Check if this is a connection to Anthropic
    if (addr->sa_family == AF_INET) {
        struct sockaddr_in *sin = (struct sockaddr_in *)addr;
        const char *ip_str = inet_ntoa(sin->sin_addr);
        
        // Check if IP is in our block list
        for (int i = 0; blocked_ips[i] != NULL; i++) {
            if (strcmp(ip_str, blocked_ips[i]) == 0) {
                // Redirect to local proxy
                fprintf(stderr, "[INTERCEPT] Redirecting %s:443 -> localhost:443\n", ip_str);
                
                struct sockaddr_in proxy_addr;
                memset(&proxy_addr, 0, sizeof(proxy_addr));
                proxy_addr.sin_family = AF_INET;
                proxy_addr.sin_port = htons(443);
                inet_pton(AF_INET, "127.0.0.1", &proxy_addr.sin_addr);
                
                return original_connect(sockfd, (struct sockaddr *)&proxy_addr, sizeof(proxy_addr));
            }
        }
    }
    
    // Allow all other connections
    return original_connect(sockfd, addr, addrlen);
}
