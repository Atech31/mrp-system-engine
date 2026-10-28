package com.example.demo.model;
import java.util.List;
import java.util.ArrayList;

public class BomNode {
    public Long partId;
    public Double quantity;
    public List<BomNode> children = new ArrayList<>();

    public BomNode(Long partId, Double quantity) {
        this.partId = partId;
        this.quantity = quantity;
    }
}
