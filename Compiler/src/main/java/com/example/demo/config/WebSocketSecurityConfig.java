package com.example.demo.config;

import com.example.demo.entity.types.User;
import com.example.demo.repositories.UserRepository;
import com.example.demo.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket security configuration that enforces JWT authentication at the STOMP
 * {@code CONNECT} frame, before any subscription or message is accepted.
 * <p>
 * Without this, any unauthenticated client could open a STOMP connection, subscribe
 * to any room's {@code /topic/room/{roomId}}, and receive all collaborative updates.
 * </p>
 * <p>
 * Expected client usage: set the STOMP header {@code Authorization: Bearer <token>}
 * when connecting:
 * <pre>
 *   client.connect({ Authorization: 'Bearer ' + token }, onConnected, onError);
 * </pre>
 * </p>
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthUtil authUtil;
    private final UserRepository userRepository;

    /**
     * Registers the JWT channel interceptor on the inbound STOMP channel.
     * Only {@code CONNECT} frames are inspected; subsequent frames in an already
     * authenticated session inherit the {@link java.security.Principal} set here.
     *
     * @param registration channel registration
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        log.warn("STOMP CONNECT rejected: missing or malformed Authorization header");
                        throw new org.springframework.messaging.MessagingException(
                                "Missing JWT token in STOMP CONNECT frame");
                    }

                    String token = authHeader.substring(7).trim();
                    try {
                        String username = authUtil.getUsernameFromToken(token);
                        User user = userRepository.findByUserName(username);
                        if (user == null) {
                            throw new org.springframework.messaging.MessagingException(
                                    "Unknown user: " + username);
                        }

                        UsernamePasswordAuthenticationToken principal =
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                        // Attach the authenticated principal to the STOMP session so that
                        // subsequent SUBSCRIBE/SEND frames can read it via SimpMessageHeaderAccessor.getUser()
                        accessor.setUser(principal);
                        log.info("STOMP CONNECT authenticated for user [{}]", username);
                    } catch (org.springframework.messaging.MessagingException me) {
                        throw me;
                    } catch (Exception ex) {
                        log.warn("STOMP CONNECT rejected: invalid JWT — {}", ex.getMessage());
                        throw new org.springframework.messaging.MessagingException(
                                "Invalid JWT token: " + ex.getMessage());
                    }
                }

                return message;
            }
        });
    }
}
