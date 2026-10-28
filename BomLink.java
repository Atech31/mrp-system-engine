  package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bom_link")
public class BomLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long parentItemId;
    private Long childItemId;
    private Integer quantityRequired;

    public BomLink() {}

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public Long getParentItemId() { 
        return parentItemId; 
    }
    public void setParentItemId(Long parentItemId) { 
        this.parentItemId = parentItemId; 
    }

    public Long getChildItemId() { 
        return childItemId; 
    }
    public void setChildItemId(Long childItemId) { 
        this.childItemId = childItemId; 
    }

    public Integer getQuantityRequired() { 
        return quantityRequired; 
    }
    public void setQuantityRequired(Integer quantityRequired) { 
        this.quantityRequired = quantityRequired; 
    }
}
