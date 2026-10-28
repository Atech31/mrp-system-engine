package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.BomLink;
import com.example.demo.repository.BomLinkRepository;

import java.util.List;

@RestController
@RequestMapping("/api/bom")
@CrossOrigin(origins = "*")
public class BomController {

    @Autowired
    private BomLinkRepository bomLinkRepository;

    // Receives parent and child links from the dashboard UI and writes them to the DB
    @PostMapping
    public BomLink addBomLink(@RequestBody BomLink bomLink) {
        return bomLinkRepository.save(bomLink);
    }
    
    // Fetch all active parent-component relationships for the UI grid
    @GetMapping
    public List<BomLink> getAllBomLinks() {
        return bomLinkRepository.findAll();
    }
}
