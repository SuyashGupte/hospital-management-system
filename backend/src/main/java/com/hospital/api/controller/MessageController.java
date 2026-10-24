package com.hospital.api.controller;

import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hospital.api.config.OpenApiConfig;
import com.hospital.api.dto.Dtos.MessageRequest;
import com.hospital.api.dto.Dtos.UnreadCount;
import com.hospital.api.security.AuthUser;
import com.hospital.api.service.MessageService;
import com.hospital.models.Message;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/messages")
@Tag(name = "Messages", description = "Internal messaging. Replaces ComposeEmail / ViewMessage, inbox and sent mail. Available to every role")
@SecurityRequirement(name = OpenApiConfig.BEARER)
public class MessageController {

    private final MessageService messages;

    public MessageController(MessageService messages) {
        this.messages = messages;
    }

    @Operation(summary = "Inbox", description = "Any role. Newest first.")
    @GetMapping("/inbox")
    public List<Message> inbox(@AuthenticationPrincipal AuthUser user) {
        return messages.inbox(user);
    }

    @Operation(summary = "Sent mail", description = "Any role. Newest first.")
    @GetMapping("/sent")
    public List<Message> sent(@AuthenticationPrincipal AuthUser user) {
        return messages.sent(user);
    }

    @Operation(summary = "Number of unread messages", description = "Any role. Used for the sidebar badge.")
    @GetMapping("/unread-count")
    public UnreadCount unread(@AuthenticationPrincipal AuthUser user) {
        return messages.unread(user);
    }

    @Operation(summary = "Read a message (marks it as read)", description = "Any role, but only the sender or recipient (403 otherwise).")
    @GetMapping("/{id}")
    public Message read(@AuthenticationPrincipal AuthUser user, @PathVariable Integer id) {
        return messages.read(user, id);
    }

    @Operation(summary = "Send a message about a patient", description = "Any role. Provide recipientId OR allReceptionists=true (one message is created per receptionist).")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Integer> compose(@AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody MessageRequest request) {
        return Map.of("delivered", messages.compose(user, request));
    }
}
