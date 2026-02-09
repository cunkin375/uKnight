package com.uknight.videocall.user;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

@Service
public class UserService {

    private static final List<User> userList = new ArrayList<>();

    public void register(User user) {
        user.setStatus("online");
        userList.add(user);
    }

    public User login(User user) {
        var userIndex = IntStream.range(0, userList.size())
                .filter(i -> userList.get(i).getEmail().equals(user.getEmail()))
                .findAny()
                .orElseThrow(() -> new RuntimeException("User not found"));
        var cUser = userList.get(userIndex);
        if (!cUser.getPassword().equals(user.getPassword())) {
            throw new RuntimeException("Password incorrect");
        }
        cUser.setStatus("online");
        return cUser;
    }

    public void logout(User user) {
        var userIndex = IntStream.range(0, userList.size())
                .filter(i -> userList.get(i).getEmail().equals(user.getEmail()))
                .findAny()
                .orElseThrow(() -> new RuntimeException("User not found"));
        userList.get(userIndex).setStatus("offline");
    }

    public List<User> getAllUsers() {
        return userList;
    }

}
