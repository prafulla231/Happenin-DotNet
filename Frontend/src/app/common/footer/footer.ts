import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
   brandName: string = "Happenin'";
 contactEmail: string = 'happenin.events.app@gmail.com';
  @Input() showSocials: boolean = false;
  @Input() customMessage: string = '';
}
