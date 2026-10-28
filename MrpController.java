package com.example.demo.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.BomLink;
import com.example.demo.model.MrpResult;
import com.example.demo.model.Part;
import com.example.demo.repository.BomLinkRepository;
import com.example.demo.repository.PartRepository;

@RestController
@RequestMapping("/api/mrp")
@CrossOrigin(origins = "*")
public class MrpController {

    @Autowired
    private PartRepository partRepository;

    @Autowired
    private BomLinkRepository bomLinkRepository;

    @RequestMapping("/calculate")
    public List<MrpResult> calculateMRP(
            @RequestParam(required = false) Long partId,
            @RequestParam(required = false) Long productId,
            @RequestParam Integer quantity) {
        
        Long targetId = (partId != null) ? partId : productId;
        List<MrpResult> results = new ArrayList<>();

        if (targetId == null) {
            return results;
        }

        List<BomLink> links = bomLinkRepository.findByParentItemId(targetId);

        for (BomLink link : links) {
            Part component = partRepository.findById(link.getChildItemId()).orElse(null);
            
            if (component != null) {
                int grossRequirement = quantity * link.getQuantityRequired();
                int netRequirement = grossRequirement - component.getCurrentStock();
                if (netRequirement < 0) {
                    netRequirement = 0;
                }

                MrpResult result = new MrpResult(
                    component.getId(),
                    component.getPartName(),
                    grossRequirement,
                    component.getCurrentStock(),
                    netRequirement,
                    component.getLeadTimeDays()
                );
                results.add(result);
            }
        }
        return results;
    }
}
